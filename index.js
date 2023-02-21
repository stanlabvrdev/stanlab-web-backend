const mongoDB = require("./utils/db");
const config = require("config");
// const passport = require("passport");

const app = require("./app");
const envConfig = require("./config/env");

const env = envConfig.getAll();

if (!env.jwtKey) {
    console.log("FETAL ERROR: jwtKey is not set");
}
if (!env.mailgun_API_KEY) {
    console.log("FETAL ERROR: mailgun API Key is not set");
}
mongoDB
    .then((res) => console.log("Connected to MongoDB..."))
    .catch((err) => console.log("Could not connect to Database ", err));
const port = env.port || 8000;
app.listen(port, () => {
    console.log("============================");
    console.log(`Listening on port ${port}!!`);
    console.log("============================");
});