const googleStrategy = require("../services/googleStrategy");
const { Teacher } = require("../models/teacher");
const config = require("config");

const envConfig = require("../config/env");

const env = envConfig.getAll();

const configSettings = {
    clientID: env.teacher_google_CLIENT_ID,
    clientSecret: env.teacher_google_CLIENT_SECRET,
};

module.exports = function(passport) {
    passport.use(googleStrategy(Teacher, configSettings, "/api/teachers/auth/google/callback", "teacher"));
};