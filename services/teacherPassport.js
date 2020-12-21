const googleStrategy = require("../services/googleStrategy");
const { Teacher } = require("../models/teacher");
const config = require("config");

const configSettings = {
    clientID: config.get("teacher_google_CLIENT_ID"),
    clientSecret: config.get("teacher_google_CLIENT_SECRET"),
};

module.exports = function(passport) {
    passport.use(
        googleStrategy(
            Teacher,
            configSettings,
            "/api/teachers/auth/google/callback"
        )
    );
};