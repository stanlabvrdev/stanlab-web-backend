const mongoDB = require("./utils/db");

// const passport = require("passport");

const app = require("./app");
const envConfig = require("./config/env");
const Logger = require("./utils/logger");

const env = envConfig.getAll();

if (!env.jwtKey) {
    Logger.info("FETAL ERROR: jwtKey is not set");
}
if (!env.mailgun_API_KEY) {
    Logger.info("FETAL ERROR: mailgun API Key is not set");
}
mongoDB
    .then((res) => Logger.info("Connected to MongoDB..."))
    .catch((err) => Logger.info("Could not connect to Database ", err));
const port = env.port || 8000;
app.listen(port, () => {
    Logger.info("============================");
    Logger.info(`Listening on port ${port}!!`);
    Logger.info("============================");
});