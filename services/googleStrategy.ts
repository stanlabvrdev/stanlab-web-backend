import bcrypt from "bcryptjs";
import GoogleStrategy from "passport-google-oauth20";
import generateRandomString from "../utils/randomStr";
import { Teacher } from "../models/teacher";
import { Student } from "../models/student";
import Logger from "../utils/logger";

const Strategy = GoogleStrategy.Strategy;

export default function (Model, configSettings, callbackUri, role) {
  return new Strategy(
    {
      clientID: configSettings.clientID,
      clientSecret: configSettings.clientSecret,
      callbackURL: callbackUri,
      proxy: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      const modelRes = await Model.findOne({
        googleId: profile.id,
        provider: "google",
      });

      if (modelRes) {
        return done(null, modelRes);
      }
      if (
        role === "student" &&
        (await Teacher.findOne({
          email: profile.emails[0].value,
        }))
      ) {
        return done(null, false, {
          message: "You cannot use same email registered as  teacher",
        });
      }
      if (
        role === "teacher" &&
        (await Student.findOne({
          email: profile.emails[0].value,
        }))
      ) {
        return done(null, false, {
          message: "You cannot use same email registered as Student",
        });
      } else {
        // create this Teacher
        try {
          let password = generateRandomString(10);
          const salt = await bcrypt.genSalt(10);
          password = await bcrypt.hash(password, salt);
          const modelRes = new Model({
            password,
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            photo: profile.photos[0].value,
            provider: "google",
          });
          await modelRes.save();
          done(null, modelRes);
        } catch (error) {
          Logger.error(`ERROR: ${JSON.stringify(error)}`);
        }
      }
    }
  );
}
