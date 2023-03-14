const jwt = require("jsonwebtoken");

const envConfig = require("../config/env");
const CustomError = require("../services/exceptions/custom");
const env = envConfig.getAll();

const { ServerErrorHandler } = require("../services/response/serverResponse");

function teacherAuth(req, res, next) {
    const token = req.header("x-auth-token");

    if (!token) return res.status(401).send("Access Denied!. No token provided");
    try {
        const decoded = jwt.verify(token, env.jwtKey);
        // check to see if the role is teacher -> send 403

        if (decoded.role !== "Teacher") return res.status(403).send("Access Denied!.");
        req.teacher = decoded;
        next();
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

function teacherStudentAuth(req, res, next) {
    const token = req.header("x-auth-token");

    try {
        if (!token) throw new CustomError(401, "Access Denied!. No token provided");
        const decoded = jwt.verify(token, env.jwtKey);
        // check to see if the role is teacher -> send 403
        if (decoded.role !== "Teacher" || decoded.role !== "Student") throw new CustomError(403, "Access Denied!.");
        req.teacher = decoded;
        next();
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

function studentAuth(req, res, next) {
    const token = req.header("x-auth-token");

    if (!token) return res.status(401).send("Access Denied!. No token provided");
    try {
        const decoded = jwt.verify(token, env.jwtKey);

        if (decoded.role !== "Student") return res.status(403).send("Access Denied!.");
        req.student = decoded;
        next();
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

function schoolAuth(req, res, next) {
    const token = req.header("x-auth-token");

    if (!token) return res.status(401).send("Access Denied!. No token provided");
    try {
        const decoded = jwt.verify(token, env.jwtKey);
        if (decoded.role !== "School") return res.status(403).send("Access Denied!.");
        req.school = decoded;
        next();
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = { teacherAuth, studentAuth, schoolAuth, teacherStudentAuth };