import { OAuth2Client } from "google-auth-library";

import _ from "lodash";
import bcrypt from "bcryptjs";
import Joi from "joi";
import { Teacher } from "../models/teacher";
import { Student } from "../models/student";
import generateRandomString from "../utils/randomStr";
import constants from "../utils/constants";
import moment from "moment";
import { SchoolAdmin } from "../models/schoolAdmin";
import { ServerErrorHandler } from "../services/response/serverResponse";
import envConfig from "../config/env";
import { doValidate } from "../services/exceptions/validator";
import studentService from "../services/student/student.service";
import BadRequestError from "../services/exceptions/bad-request";
import CustomError from "../services/exceptions/custom";

const env = envConfig.getAll();

function validateAuth(auth) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(auth);
}

async function teacherGoogleAuth(req, res) {
  const client: any = new OAuth2Client(env.teacher_google_CLIENT_ID);
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
      if (isStudent) {
        throw new CustomError(403, "Email registered as Student");
      }

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
  const client: any = new OAuth2Client(env.student_google_CLIENT_ID);
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
    const student = await studentService.findOne({ $or: [{ email }, { userName: email }] });
    if (!student) throw new BadRequestError("Invalid Credentials");

    const isValid = await bcrypt.compare(password, student.password);

    if (!isValid) throw new BadRequestError("Invalid credentials");

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
export default { studentGoogleAuth, studentLogin, teacherGoogleAuth, teacherLogin, studentLabLogin, schoolAdminLogin };
