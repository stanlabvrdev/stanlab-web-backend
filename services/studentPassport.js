const googleStrategy = require("../services/googleStrategy");
const { Student } = require("../models/student");
const config = require("config");

const configSettings = {
    clientID: config.get("student_google_CLIENT_ID"),
    clientSecret: config.get("student_google_CLIENT_SECRET"),
};

module.exports = function(passport) {
    passport.use(
        googleStrategy(
            Student,
            configSettings,
            "/api/students/auth/google/callback",
            "student"
        )
    );
};