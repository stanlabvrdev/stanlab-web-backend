const dotenv = require("dotenv");

dotenv.config();

const sgMail = require("@sendgrid/mail");

const envConfig = require("../config/env");
const env = envConfig.getAll();

sgMail.setApiKey(env.sendGrid_API_KEY);

const stanLabMail = "info@stanlab.com";
const mailgunAPIKey = env.mailgun_API_KEY;

const mailgun = require("mailgun-js");
const Logger = require("../utils/logger");
// const DOMAIN = "https://www.stanlabvr.com";

Logger.info(`===Connecting to Mailgun: ${mailgunAPIKey}=====`);
const DOMAIN = "stanlabvr.com";
const mg = mailgun({ apiKey: mailgunAPIKey, domain: DOMAIN });

function sendStudentInviteEmail(student, password) {
    const data = {
        from: "StanLab <info@stanlab.com>",
        to: student.email,
        subject: "School invitation",
        template: "student-invitation",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: student.email,
            password: password,
            name: student.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            Logger.error(`error occured ${JSON.stringify(error)}`);
        }
    });
}

function sendTeacherWelcomeEmail(teacher, password) {
    const data = {
        from: "StanLab <info@stanlab.com>",
        to: teacher.email,
        subject: "School invitation",
        template: "welcome-teacher",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: teacher.email,
            password: password,
            name: teacher.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            console.log(error);
            Logger.error(`error occured ${JSON.stringify(error)}`);
        }
    });
}

function sendEmailToSchoolAdmin(admin) {
    const data = {
        from: "StanLab <info@stanlab.com>",
        to: admin.email,
        subject: "Welcome to StanLab",
        template: "welcome-school-admin",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: admin.email,
            name: admin.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            Logger.error(`error occured ${JSON.stringify(error)}`);
        }
    });
}

function doSendInvitationEmail(student, teacher, password) {
    const data = {
        from: "StanLab <info@stanlab.com>",
        to: student.email,
        subject: "Invitation",
        template: "student-invitation",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: student.email,
            password: password,
            student_name: student.name || "Student",
            teacher_name: teacher.name || teacher.email,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            Logger.error(`error occured ${JSON.stringify(error)}`);
        }
    });
}

async function sendResetPassword(student, token, isStudent = true) {
    const data = {
        from: "StanLab <info@stanlab.com>",
        to: student.email,
        subject: "Reset Password",
        template: "forgetpassword",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: student.email,

            name: student.name || student.email,
            url: `https://app.stanlab.co/${isStudent ? "students" : "teachers"}/reset-password/${token}`,
        }),
    };

    Logger.info(`Sending data: ${JSON.stringify(data)}`);
    mg.messages().send(data, function(error, body) {
        if (error) {
            Logger.error(`error occured ${JSON.stringify(error)}`);
        }
    });
}

module.exports = {
    doSendInvitationEmail,
    sendEmailToSchoolAdmin,

    sendStudentInviteEmail,
    sendResetPassword,
    sendTeacherWelcomeEmail,
};