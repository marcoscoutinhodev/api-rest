const express = require("express");
const User = require("../model/user");

const router = express.Router();

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

        return res.send({ user });
    } catch {
        return res
            .status(400)
            .send({ error: "Registraion failed" });
    }
});

module.exports = (app) => app.use("/auth", router);