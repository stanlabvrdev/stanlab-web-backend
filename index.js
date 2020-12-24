const express = require("express");
const mongoDB = require("./utils/db");
const config = require("config");
// const passport = require("passport");
const Joi = require("joi");
const cors = require("cors");
Joi.objectId = require("joi-objectid")(Joi);
const questionsRoute = require("./routes/questions");
const teachersRoute = require("./routes/teachers");
const studentRoute = require("./routes/students");
const loginRoute = require("./routes/login");

const { teacherPassport } = require("./services/initPassport");
const { studentPassport } = require("./services/initPassport");

//passport  strategies
require("./services/teacherPassport")(teacherPassport);
require("./services/studentPassport")(studentPassport);
const app = express();

//initialize passports
app.use(teacherPassport.initialize({ userProperty: "user" }));
app.use(studentPassport.initialize({ userProperty: "user" }));

app.use(express.json());
app.use(cors());

// initialize teacherAccount

app.use("/api/questions", questionsRoute);
app.use("/api/teachers", teachersRoute);
app.use("/api/students", studentRoute);
app.use("/api/login", loginRoute);

console.log(config.get("student_google_CLIENT_SECRET"));
console.log(app.get("env"));
if (!config.get("jwtKey")) {
    console.log("FETAL ERROR: jwtKey is not set");
}
if (!config.get("sendGrid_API_KEY")) {
    console.log("FETAL ERROR: SendGrid API Key is not set");
}
console.log(config.get("student_google_CLIENT_SECRET"));
console.log(config.get("teacher_google_CLIENT_SECRET"));
mongoDB
    .then((res) => console.log("Connected to MongoDB..."))
    .catch((err) => console.log("Could not connect to Database ", err));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));