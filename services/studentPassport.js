const googleStrategy = require("../services/googleStrategy");
const { Student } = require("../models/student");

const envConfig = require("../config/env");

const env = envConfig.getAll();

const configSettings = {
    clientID: env.student_google_CLIENT_ID,
    clientSecret: env.student_google_CLIENT_SECRET,
};

module.exports = function(passport) {
    passport.use(googleStrategy(Student, configSettings, "/api/students/auth/google/callback", "student"));
};