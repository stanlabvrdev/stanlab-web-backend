import mongoDB, { runSeeds } from "./utils/db";
import { database, up } from "migrate-mongo";
import mongooose from "mongoose";
import { Db } from "mongodb";

// import passport from "passport"

import app from "./app";
import envConfig from "./config/env";
import Logger from "./utils/logger";

const env = envConfig.getAll();

if (!env.jwtKey) {
  Logger.info("FETAL ERROR: jwtKey is not set");
}
if (!env.mailgun_API_KEY) {
  Logger.info("FETAL ERROR: mailgun API Key is not set");
}

mongoDB
  .then(async (res) => {
    Logger.info("Connected to MongoDB...");

    await runSeeds();

    //Run pending migrations with mongo-server
    const { db, client } = await database.connect();
    await up(db, client);
  })
  .catch((err) => Logger.info("Could not connect to Database ", err));
const port = env.port || 8000;
app.listen(port, () => {
  Logger.info("============================");
  Logger.info(`Listening on port ${port}!!`);
  Logger.info("============================");
});
