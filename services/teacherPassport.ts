import googleStrategy from "../services/googleStrategy";
import { Teacher } from "../models/teacher";

import envConfig from "../config/env";

const env = envConfig.getAll();

const configSettings = {
  clientID: env.teacher_google_CLIENT_ID,
  clientSecret: env.teacher_google_CLIENT_SECRET,
};

export default function (passport) {
  passport.use(googleStrategy(Teacher, configSettings, "/api/teachers/auth/google/callback", "teacher"));
}
