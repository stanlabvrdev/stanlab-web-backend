import googleStrategy from "../services/googleStrategy";
import { Student } from "../models/student";

import envConfig from "../config/env";

const env = envConfig.getAll();

const configSettings = {
  clientID: env.student_google_CLIENT_ID,
  clientSecret: env.student_google_CLIENT_SECRET,
};

export default function (passport) {
  passport.use(googleStrategy(Student, configSettings, "/api/students/auth/google/callback", "student"));
}
