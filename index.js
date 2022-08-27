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
const studentBillingRoute = require("./routes/studentBilling");
const teacherClassRoute = require("./routes/teacherClasses");
const labsetupRoute = require("./routes/lapSetup");
const schoolAdminRoute = require("./routes/schoolAdmins");
const systemExperimentRoute = require("./routes/systemExperiment");
const labExperimentRoute = require("./routes/lab");

const { teacherPassport } = require("./services/initPassport");
const { studentPassport } = require("./services/initPassport");

//passport  strategies
require("./services/teacherPassport")(teacherPassport);
require("./services/studentPassport")(studentPassport);
const app = express();

//initialize passports
app.use(teacherPassport.initialize({ userProperty: "user" }));
app.use(studentPassport.initialize({ userProperty: "user" }));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

app.use("/api/lab", labsetupRoute);
app.use("/api/login", loginRoute);
app.use("/api/schools", schoolAdminRoute);
app.use("/api/students/billing", studentBillingRoute);
app.use("/api/students", studentRoute);
app.use("/api/teachers", teachersRoute);
app.use("/api/classes", teacherClassRoute);
app.use("/api/questions", questionsRoute);
app.use("/api/system-experiments", systemExperimentRoute);
app.use("/api/system-experiments/lab", labExperimentRoute);

if (!config.get("jwtKey")) {
    console.log("FETAL ERROR: jwtKey is not set");
}
if (!config.get("sendGrid_API_KEY")) {
    console.log("FETAL ERROR: SendGrid API Key is not set");
}
mongoDB
    .then((res) => console.log("Connected to MongoDB..."))
    .catch((err) => console.log("Could not connect to Database ", err));
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Listening on port ${port}`));