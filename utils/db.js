const mongoose = require("mongoose");
const config = require("config");

module.exports = mongoose.connect(config.get("mongodb_URI"), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
