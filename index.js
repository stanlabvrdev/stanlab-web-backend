const express = require("express");
const app = express();
const mongoDB = require("./utils/db");

const port = process.env.PORT || 3000;

console.log(app.get("env"));
mongoDB
  .then((res) => console.log("Connected to MongoDB..."))
  .catch((err) => console.log("Could not connect to Database ", err));
app.listen(port, () => console.log(`Listening on port ${port}`));
