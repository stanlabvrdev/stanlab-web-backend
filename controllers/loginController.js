const { OAuth2Client } = require("google-auth-library");
const config = require("config");
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { Teacher } = require("../models/teacher");
const { Student } = require("../models/student");
const generateRandomString = require("../utils/randomStr");
const constants = require("../utils/constants");
const moment = require("moment");
const { SchoolAdmin } = require("../models/schoolAdmin");
const { ServerErrorHandler } = require("../services/response/serverResponse");
const envConfig = require("../config/env");
const { doValidate } = require("../services/exceptions/validator");
const studentService = require("../services/student/student.service");
const BadRequestError = require("../services/exceptions/bad-request");
const env = envConfig.getAll();

function validateAuth(auth) {
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    });

    return schema.validate(auth);
}

async function teacherGoogleAuth(req, res) {
    const client = new OAuth2Client(env.teacher_google_CLIENT_ID);
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).send({ message: "token ID Not found" });

    try {
        const {
            payload: { email_verified, name, email, picture },
        } = await client.verifyIdToken({
            idToken: tokenId,
            audience: env.teacher_google_CLIENT_ID,
        });
        if (email_verified) {
            // check if this email as registered as a teacher
            const isStudent = await Student.findOne({ email });
            if (isStudent) return res.status(403).send({ message: "Email registered as Student" });
            const teacher = await Teacher.findOne({ email });
            if (teacher) {
                // login
                const token = teacher.generateAuthToken();
                res.send(token);
            } else {
                let password = email + generateRandomString(10);
                const salt = await bcrypt.genSalt(10);
                password = await bcrypt.hash(password, salt);
                // create new teacher
                let teacher = new Teacher({
                    email,
                    password,
                    name,
                    email,
                    imageUrl: picture,
                });
                await teacher.save();
                const token = teacher.generateAuthToken();
                res.send(token);
            }
        }
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function teacherLogin(req, res) {
    const { email, password } = req.body;
    const { error } = validateAuth(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(400).send("Invalid Credentials");

    const isValid = await bcrypt.compare(password, teacher.password);

    if (!isValid) return res.status(400).send("Invalid credentials");
    const token = teacher.generateAuthToken();
    res.send(token);
}

async function studentGoogleAuth(req, res) {
    const client = new OAuth2Client(env.student_google_CLIENT_ID);
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).send({ message: "token ID Not found" });

    try {
        const {
            payload: { email_verified, name, email, picture },
        } = await client.verifyIdToken({
            idToken: tokenId,
            audience: env.student_google_CLIENT_ID,
        });
        if (email_verified) {
            // check if this email as registered as a teacher
            const isTeacher = await Teacher.findOne({ email });
            if (isTeacher) return res.status(403).send({ message: "Email registered as Teacher" });
            const student = await Student.findOne({ email });
            if (student) {
                // login
                const token = student.generateAuthToken();
                res.send(token);
            } else {
                let password = email + generateRandomString(10);
                const salt = await bcrypt.genSalt(10);
                password = await bcrypt.hash(password, salt);
                // create new teacher
                let student = new Student({
                    email,
                    password,
                    name,
                    email,
                    imageUrl: picture,
                });
                student[constants.trialPeriod.title] = moment().add(constants.trialPeriod.days, "days");
                await student.save();
                const token = student.generateAuthToken();
                res.send(token);
            }
        }
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function studentLogin(req, res) {
    const { email, password } = req.body;
    try {
        doValidate(validateAuth(req.body));

        const student = await studentService.findOne({ $or: [{ email }, { userName: email }] });
        if (!student) throw new BadRequestError("Invalid Credentials");

        const isValid = await bcrypt.compare(password, student.password);

        if (!isValid) throw new BadRequestError("Invalid credentials");
        const token = student.generateAuthToken();

        res.send(token);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function schoolAdminLogin(req, res) {
    const { email, password } = req.body;
    const { error } = validateAuth(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    const admin = await SchoolAdmin.findOne({ email });
    if (!admin) return res.status(400).send("Invalid Credentials");

    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) return res.status(400).send("Invalid credentials");
    const token = admin.generateAuthToken();
    res.send(token);
}

async function studentLabLogin(req, res) {
    const { email, password } = req.body;

    try {
        const student = await Student.findOne({ email });
        if (!student) return res.status(404).send("Invalid Credentials");
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) return res.status(404).send("Invalid credentials");

        const token = student.generateAuthToken();
        const studentCredentials = {
            token,
            name: student.name,
            email: student.email,
            _id: student._id,
        };
        res.send(studentCredentials);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
module.exports = {
    studentGoogleAuth,
    studentLogin,
    teacherGoogleAuth,
    teacherLogin,
    studentLabLogin,
    schoolAdminLogin,
};