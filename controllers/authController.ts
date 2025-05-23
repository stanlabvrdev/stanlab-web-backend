import bcrypt from "bcryptjs";
import moment from "moment";
import _ from "lodash";
import { sendResetPassword } from "../services/email";
import { Student } from "../models/student";

import { EmailToken } from "../models/emailToken";
import crypto from "crypto";
import { Teacher } from "../models/teacher";
import { ServerErrorHandler } from "../services/response/serverResponse";
import { SchoolAdmin } from "../models/schoolAdmin";

async function resetPassword(entity, data) {
  const token = crypto.randomBytes(40).toString("hex");
  const expiry = moment().add(2, "hours");

  const emailToken = new EmailToken({
    token,
    expiredAt: expiry,
    [entity]: data._id,
  });

  await emailToken.save();

  // send email notification

  if (entity === "student" || entity === "teacher") {
    return sendResetPassword(data, token, `${[entity]}s`);
  }

  return sendResetPassword(data, token, [entity]);
}

async function resetStudentPassword(req, res) {
  let { email } = req.body;

  try {
    if (!email)
      return res.status(400).send({ message: "password is required" });

    const student = await Student.findOne({ email });
    if (!student) return res.status(404).send({ message: "student not found" });

    await resetPassword("student", student);

    res.send({ message: "reset password link sent successfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function resetTeacherPassword(req, res) {
  let { email } = req.body;

  try {
    if (!email)
      return res.status(400).send({ message: "password is required" });

    const teacher = await Teacher.findOne({ email });
    if (!teacher) return res.status(404).send({ message: "teacher not found" });

    await resetPassword("teacher", teacher);

    res.send({ message: "reset password link sent successfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function resetSchoolPassword(req, res) {
  let { email } = req.body;

  try {
    if (!email) return res.status(400).send({ message: "email is required" });

    const admin = await SchoolAdmin.findOne({ email });
    if (!admin)
      return res.status(404).send({ message: "school admin not found" });

    await resetPassword("admin", admin);

    res.send({ message: "reset password link sent successfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function confirmStudentResetPassword(req, res) {
  let { token, new_password } = req.body;

  try {
    if (!new_password || !token)
      return res
        .status(400)
        .send({ message: "password and token is required" });

    const emailToken = await EmailToken.findOne({ token });
    if (!emailToken)
      return res.status(400).send({ message: "token not found" });
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
    ServerErrorHandler(req, res, error);
  }
}

async function confirmTeacherResetPassword(req, res) {
  let { token, new_password } = req.body;

  try {
    if (!new_password || !token)
      return res
        .status(400)
        .send({ message: "password and token is required" });

    const emailToken = await EmailToken.findOne({ token });
    if (!emailToken)
      return res.status(400).send({ message: "token not found" });

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
    ServerErrorHandler(req, res, error);
  }
}

async function confirmSchoolResetPassword(req, res) {
  let { token, new_password } = req.body;

  try {
    if (!new_password || !token)
      return res
        .status(400)
        .send({ message: "password and token are required" });

    const emailToken = await EmailToken.findOne({ token });
    if (!emailToken)
      return res.status(400).send({ message: "token not found" });
    // check if token has expired

    const isExpired = moment(emailToken.expiredAt).diff(moment());

    if (isExpired < 0) {
      return res.status(400).send({ message: "token already expired" });
    }

    const admin = await SchoolAdmin.findOne({ _id: emailToken.admin });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(new_password, salt);

    await EmailToken.deleteOne({ token });

    await admin.save();

    res.send({ message: "password  reset  successfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default {
  resetStudentPassword,
  resetTeacherPassword,
  resetSchoolPassword,
  confirmStudentResetPassword,
  confirmTeacherResetPassword,
  confirmSchoolResetPassword,
};
