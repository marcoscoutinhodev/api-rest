const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const authConfig = require("../../config/auth.json");
const User = require("../model/user");
const mailer = require("../../module/mailer");

const router = express.Router();

function generateToken(params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    });
}

router.post("/register", async (req, res) => {
    const { email } = req.body;

    try {
        if (await User.findOne({ email })) {
            return res
                .status(400)
                .send({ error: "User already exists" });
        }

        const user = await User.create(req.body);

        user.password = null;

        return res.send({
            user,
            token: generateToken({ id: user.id })
        });
    } catch {
        return res
            .status(400)
            .send({ error: "Registraion failed" });
    }
});

router.post("/authenticate", async (req, res) => {
    const { email, password } = req.body;

    const user = await User
        .findOne({ email })
        .select("+password");

    if (!user) {
        return res
            .status(400)
            .send({ error: "User not found" });
    }

    if (!await bcrypt.compare(password, user.password)) {
        return res
            .status(400)
            .send({ error: "Invalid password" });
    }

    user.password = null;

    res.send({
        user,
        token: generateToken({ id: user.id })
    });
});

router.post("/forgot_password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res
                .status(400)
                .send({ error: "User not found" });
        }

        const token = crypto
            .randomBytes(20)
            .toString("hex");

        const now = new Date();
        now.setHours(now.getHours() + 1);

        await User.findByIdAndUpdate(user.id, {
            "$set": {
                passwordResetToken: token,
                passwordResetExpire: now
            }
        })

        mailer.sendMail({
            to: email,
            from: "marcoscoutinho@dev.com",
            template: "auth/forgot_password",
            context: { token }
        }, (err) => {
            if (err) {
                return res
                    .status(400)
                    .send({ error: "Error sending a password reset email" });
            }

            return res.send();
        });
    } catch (err){
        res
            .status(400)
            .send({ error: `Erro on forgot password, try again: ${err}` });
    }
});

router.post("/reset_password", async (req, res) => {
    const { email, token, password } = req.body;

    try {
        const user = await User
            .findOne({ email })
            .select("+passwordResetToken passwordResetExpire");

        if (!user) {
            return res
                .status(400)
                .send({ error: "User not found" });
        }

        if (token !== user.passwordResetToken) {
            return res
                .status(400)
                .send({ error: "Invalid token" });
        }

        const now = new Date();

        if (now > user.passwordResetExpire) {
            return res
                .status(400)
                .send({ error: "Expired token, generate a new one" });
        }

        user.password = password;

        await user.save();

        res.send();
    } catch {
        return res
            .status(400)
            .send({ error: "Unable to reset your password, please try again" });
    }
});

module.exports = (app) => app.use("/auth", router);