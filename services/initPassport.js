const Passport = require("passport").Passport;
const teacherPassport = new Passport();
const studentPassport = new Passport();
module.exports = { teacherPassport, studentPassport };