import express from "express";

// import  passport from "passport"
import Joi from "joi";
import cors from "cors";
import JoiObjectId from "joi-objectid";
JoiObjectId(Joi).objectId;

import questionsRoute from "./routes/questions";
import teachersRoute from "./routes/teachers";

import teachersV2Route from "./routes/V2/teachers";
import studentsV2Route from "./routes/V2/students";
import teacherClassV2Route from "./routes/V2/teacherClass";

import studentRoute from "./routes/students";
import loginRoute from "./routes/login";
import studentBillingRoute from "./routes/studentBilling";
import teacherClassRoute from "./routes/teacherClasses";
import labsetupRoute from "./routes/lapSetup";
import schoolAdminRoute from "./routes/schoolAdmins";
import systemExperimentRoute from "./routes/systemExperiment";
import labExperimentRoute from "./routes/lab";
import authRoutes from "./routes/auth";
import notificationRoutes from "./routes/V2/notification";
import generatedQuestionRoutes from "./routes/V2/generated-questions";
import superAdminRouter from "./routes/superAdmin";
import subscriptionRouter from "./routes/subscription";
import gradeBookRoutes from "./routes/V2/grade-book";

import schedule from "node-schedule";
import { checkSubscription, checkCoupon } from "./helpers/scheduler";

import { teacherPassport } from "./services/initPassport";
import { studentPassport } from "./services/initPassport";

//passport  strategies
import TeacherPassport from "./services/teacherPassport";
TeacherPassport(teacherPassport);

import StudentPassport from "./services/studentPassport";
StudentPassport(studentPassport);

const app = express();

// Swagger files
const swaggerUi = require("swagger-ui-express");
// const swaggerFile = require("./swagger-output.json");
const { morganMiddleware } = require("./middleware/morgan");
app.use(morganMiddleware);
// Swagger for API documentation
// app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

//initialize passports
app.use(
  teacherPassport.initialize({
    userProperty: "user",
  })
);
app.use(
  studentPassport.initialize({
    userProperty: "user",
  })
);

app.use(
  express.json({
    limit: "50mb",
  })
);
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);
app.use(cors());

app.get("/", (req, res) => {
  res.send("Welcome to Stanlab Backend");
});

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
app.use("/api/super-admin", superAdminRouter);
app.use("/api/subscriptions", subscriptionRouter);

// V2
app.use("/api/v2/teachers", teachersV2Route);
app.use("/api/v2/students", studentsV2Route);
app.use("/api/v2/teachers/classes", teacherClassV2Route);
app.use("/api/v2/notifications", notificationRoutes);
app.use("/api/v2/ai/questions", generatedQuestionRoutes);
app.use("/api/v2/grade-book", gradeBookRoutes);

//Scheduler
schedule.scheduleJob("0 0 * * *", checkSubscription);
schedule.scheduleJob("0 0 * * *", checkCoupon);

export default app;
