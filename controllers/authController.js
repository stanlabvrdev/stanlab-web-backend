const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");
const { sendResetPassword } = require("../services/email");
const { Student } = require("../models/student");

const { EmailToken } = require("../models/emailToken");
const crypto = require("crypto");
const { Teacher } = require("../models/teacher");

async function resetPassword(entity, data, isStudent) {
    const token = crypto.randomBytes(40).toString("hex");
    const expiry = moment().add(2, "hours");

    const emailToken = new EmailToken({
        token,
        expiredAt: expiry,
        [entity]: data._id,
    });

    await emailToken.save();

    // send email notification

    return sendResetPassword(data, token, isStudent);
}

async function resetStudentPassword(req, res) {
    let { email } = req.body;

    try {
        if (!email) return res.status(400).send({ message: "password is required" });

        const student = await Student.findOne({ email });
        if (!student) return res.status(404).send({ message: "student not found" });

        await resetPassword("student", student, true);

        res.send({ message: "reset password link sent successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
        console.log(error);
    }
}

async function resetTeacherPassword(req, res) {
    let { email } = req.body;

    try {
        if (!email) return res.status(400).send({ message: "password is required" });

        const teacher = await Teacher.findOne({ email });
        if (!teacher) return res.status(404).send({ message: "teacher not found" });

        await resetPassword("teacher", teacher, false);

        res.send({ message: "reset password link sent successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
        console.log(error);
    }
}

async function confirmStudentResetPassword(req, res) {
    let { token, new_password } = req.body;

    try {
        if (!new_password || !token) return res.status(400).send({ message: "password and token is required" });

        const emailToken = await EmailToken.findOne({ token });
        if (!emailToken) return res.status(400).send({ message: "token not found" });
        // check if token has expired

        const isExpired = moment(emailToken.expiredAt).diff(moment());

        if (isExpired < 0) {
            return res.status(400).send({ message: "token already expired" });
        }

        const student = await Student.findOne({ _id: emailToken.student });

        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(new_password, salt);

        await EmailToken.deleteOne({ token });

        await student.save();

        res.send({ message: "password  reset  successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
        console.log(error);
    }
}

async function confirmTeacherResetPassword(req, res) {
    let { token, new_password } = req.body;

    try {
        if (!new_password || !token) return res.status(400).send({ message: "password and token is required" });

        const emailToken = await EmailToken.findOne({ token });
        if (!emailToken) return res.status(400).send({ message: "token not found" });

        const isExpired = moment(emailToken.expiredAt).diff(moment());

        if (isExpired < 0) {
            return res.status(400).send({ message: "token already expired" });
        }

        const teacher = await Teacher.findOne({ _id: emailToken.teacher });

        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(new_password, salt);

        await teacher.save();

        await EmailToken.deleteOne({ token });

        res.send({ message: "password  reset  successfully" });
    } catch (error) {
        res.status(500).send({ message: error.message });
        console.log(error);
    }
}

module.exports = {
    resetStudentPassword,
    resetTeacherPassword,
    confirmStudentResetPassword,
    confirmTeacherResetPassword,
};