const express = require("express");
const mongoDB = require("./utils/db");
const config = require("config");
// const passport = require("passport");
const Joi = require("joi");
const cors = require("cors");
Joi.objectId = require("joi-objectid")(Joi);
const questionsRoute = require("./routes/questions");
const teachersRoute = require("./routes/teachers");

const teachersV2Route = require("./routes/V2/teachers");
const studentsV2Route = require("./routes/V2/students");
const teacherClassV2Route = require("./routes/V2/teacherClass");
const generatedQuestions = require('./routes/V2/generated-questions')

const studentRoute = require("./routes/students");
const loginRoute = require("./routes/login");
const studentBillingRoute = require("./routes/studentBilling");
const teacherClassRoute = require("./routes/teacherClasses");
const labsetupRoute = require("./routes/lapSetup");
const schoolAdminRoute = require("./routes/schoolAdmin.route");
const systemExperimentRoute = require("./routes/systemExperiment");
const labExperimentRoute = require("./routes/lab");
const authRoutes = require("./routes/auth");
const notificationRoutes = require("./routes/V2/notification");

const {
  teacherPassport
} = require("./services/initPassport");
const {
  studentPassport
} = require("./services/initPassport");

//passport  strategies
require("./services/teacherPassport")(teacherPassport);
require("./services/studentPassport")(studentPassport);
const app = express();

// Swagger files
const swaggerUi = require("swagger-ui-express");
const swaggerFile = require("./swagger-output.json");

// Swagger for API documentation
app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

//initialize passports
app.use(teacherPassport.initialize({
  userProperty: "user"
}));
app.use(studentPassport.initialize({
  userProperty: "user"
}));

app.use(express.json({
  limit: "50mb"
}));
app.use(express.urlencoded({
  limit: "50mb",
  extended: true
}));
app.use(cors());

app.use("/api/lab", labsetupRoute);
app.use("/api/login", loginRoute);
app.use("/api/auth", authRoutes);
app.use("/api/schools", schoolAdminRoute);
app.use("/api/students/billing", studentBillingRoute);
app.use("/api/students", studentRoute);
app.use("/api/teachers", teachersRoute);
app.use("/api/classes", teacherClassRoute);
app.use("/api/questions", questionsRoute);
app.use("/api/system-experiments", systemExperimentRoute);
app.use("/api/system-experiments/lab", labExperimentRoute);

// V2
app.use("/api/v2/teachers", teachersV2Route);
app.use("/api/v2/students", studentsV2Route);
app.use("/api/v2/teachers/classes", teacherClassV2Route);
app.use("/api/v2/notifications", notificationRoutes);
app.use("/api/v2/ai/questions", generatedQuestions)

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
app.listen(port, () => {
  console.log("============================");
  console.log(`Listening on port ${port}!!`);
  console.log("============================");
});