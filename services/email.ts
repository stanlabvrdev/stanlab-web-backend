import dotenv from "dotenv";

dotenv.config();

import sgMail from "@sendgrid/mail";

import envConfig from "../config/env";
const env = envConfig.getAll();

sgMail.setApiKey(<string>env.sendGrid_API_KEY);

const stanLabMail = "info@stanlab.com";
const mailgunAPIKey = env.mailgun_API_KEY;

import mailgun from "mailgun-js";
import Logger from "../utils/logger";
// const DOMAIN = "https://www.stanlabvr.com";

const DOMAIN = "stanlabvr.com";
const mg = mailgun({ apiKey: mailgunAPIKey, domain: DOMAIN });

export function sendStudentInviteEmail(student, password) {
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
  mg.messages().send(data, function (error, body) {
    if (error) {
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function sendTeacherWelcomeEmail(teacher, password) {
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
  mg.messages().send(data, function (error, body) {
    if (error) {
      console.log(error);
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function sendWelcomeEmailToTeacher(teacher, password) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: teacher.email,
    subject: "School invitation",
    template: "welcome_teacher_new",
    "h:X-Mailgun-Variables": JSON.stringify({
      email: teacher.email,
      password: password,
      name: teacher.name,
    }),
  };
  mg.messages().send(data, function (error, body) {
    console.log(body);
  });
}

export function sendEmailToSchoolAdmin(admin) {
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
  mg.messages().send(data, function (error, body) {
    if (error) {
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function doSendInvitationEmail(student, teacher, password) {
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
  mg.messages().send(data, function (error, body) {
    if (error) {
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export async function sendResetPassword(student, token, isStudent = true) {
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
  mg.messages().send(data, function (error, body) {
    if (error) {
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export default {
  doSendInvitationEmail,
  sendEmailToSchoolAdmin,

  sendStudentInviteEmail,
  sendResetPassword,
  sendTeacherWelcomeEmail,
  sendWelcomeEmailToTeacher,
};
