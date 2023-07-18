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

export function welcomeNewTeacher(teacher, password) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: teacher.email,
    subject: "School invitation",
    template: "welcome_new_teacher",
    "h:X-Mailgun-Variables": JSON.stringify({
      password: password,
      teachersEmail: teacher.email,
      teachersName: teacher.name,
    }),
  };
  mg.messages().send(data, function (error, body) {
    if (error) {
      //console.log(error);
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function welcomePrivateTeacher(teacher) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: teacher.email,
    subject: "School invitation",
    template: "welcome_private_teacher",
    "h:X-Mailgun-Variables": JSON.stringify({
      teachersName: teacher.name,
    }),
  };
  mg.messages().send(data, function (error, body) {
    if (error) {
      console.log(error);
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function teachersGetStartedEmail(teacher) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: teacher.email,
    subject: "School invitation",
    template: "teachers_get_started_email",
    "h:X-Mailgun-Variables": JSON.stringify({
      teachersName: teacher.name,
    }),
  };
  mg.messages().send(data, function (error, body) {
    if (error) {
      //console.log(error);
      Logger.error(`error occured ${JSON.stringify(error)}`);
    }
  });
}

export function privateTeacherAddedToSchoolAccount(teacher, schoolName) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: teacher.email,
    subject: "School invitation",
    template: "private_teacher_added_to_school_account",
    "h:X-Mailgun-Variables": JSON.stringify({
      schoolName: schoolName,
      teachersName: teacher.name,
    }),
  };
  mg.messages().send(data, function (error, body) {
    console.log(body);
  });
}

export function welcomeSchoolAdmin(admin) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: admin.email,
    subject: "Welcome to StanLab",
    template: "welcome_school_admin",
    "h:X-Mailgun-Variables": JSON.stringify({
      adminsName: admin.adminName,
      schoolName: admin.schoolName,
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

export async function sendResetPassword(user, token, entity) {
  const data = {
    from: "StanLab <info@stanlab.com>",
    to: user.email,
    subject: "Reset Password",
    template: "stanlab_password_reset",
    "h:X-Mailgun-Variables": JSON.stringify({
      name: user.name || user.adminName,
      resetlink: `https://app.stanlab.co/${entity}/reset-password/${token}`,
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
  welcomeSchoolAdmin,
  sendStudentInviteEmail,
  sendResetPassword,
  welcomeNewTeacher,
  privateTeacherAddedToSchoolAccount,
  teachersGetStartedEmail,
  welcomePrivateTeacher,
};
