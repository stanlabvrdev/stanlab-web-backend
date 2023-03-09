const mongoose = require("mongoose");

const envConfig = require("../config/env");

const env = envConfig.getAll();

module.exports = mongoose.connect(env.mongodb_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});