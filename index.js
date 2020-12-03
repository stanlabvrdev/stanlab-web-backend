const express = require("express");
const mongoDB = require("./utils/db");
const config = require("config");
const Joi = require("joi");
const cors = require("cors");
Joi.objectId = require("joi-objectid")(Joi);
const questionsRoute = require("./routes/questions");
const teachersRoute = require("./routes/teachers");
const studentRoute = require("./routes/students");
const loginRoute = require("./routes/login");
const app = express();

app.use(express.json());
app.use(cors());
// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, PATCH"
//   );
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Content-Type",
//     "Authorization",
//     " X-Requested-With"
//   );
//   res.setHeader("Access-Control-Expose-Headers", "x-auth-token");
//   next();
// });

app.use("/api/questions", questionsRoute);
app.use("/api/teachers", teachersRoute);
app.use("/api/students", studentRoute);
app.use("/api/login", loginRoute);

console.log(app.get("env"));
if (!config.get("jwtKey")) {
  console.log("FETAL ERROR: jwtKey is not set");
}
// console.log(config.get("jwtKey"));
mongoDB
  .then((res) => console.log("Connected to MongoDB..."))
  .catch((err) => console.log("Could not connect to Database ", err));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
