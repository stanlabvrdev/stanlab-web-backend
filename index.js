const express = require("express");
const mongoDB = require("./utils/db");
const config = require("config");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const questionsRoute = require("./routes/questions");
const teachersRoute = require("./routes/teachers");
const app = express();

app.use(express.json());

app.use("/api/questions", questionsRoute);
app.use("/api/teachers", teachersRoute);

console.log(app.get("env"));
mongoDB
  .then((res) => console.log("Connected to MongoDB..."))
  .catch((err) => console.log("Could not connect to Database ", err));
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
