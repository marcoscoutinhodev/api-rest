const express = require("express");
const bodyParser = require("body-parser");

require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

require("./app/controller/index")(app);

app.listen(process.env.PORT, () => {
    console.log("Server is running...");
});