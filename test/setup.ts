import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import jwt from "jsonwebtoken";
import { Student } from "../models/student";
import { Teacher } from "../models/teacher";
import { passwordService } from "../services/passwordService";
import { SchoolAdmin } from "../models/schoolAdmin";
import { SuperAdmin } from "../models/superAdmin";
import { afterAll, beforeAll, beforeEach, jest } from "@jest/globals";

interface LoginPayload {
  _id: string;
  email: string;
  role: string;
  token: string;
}

declare global {
  namespace NodeJS {
    interface Global {
      loginStudent(): LoginPayload;
      loginTeacher(): LoginPayload;
      loginSchool(): LoginPayload;
      loginAdmin(): LoginPayload;
      baseURL: string;
    }
  }
}

let mongo: MongoMemoryServer;
beforeAll(async () => {
  process.env.JWT_KEY = "test-key";

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.loginStudent = async () => {
  // Build a JWT payload.  { id, email }
  const payload: any = {
    name: "test student",
    _id: new mongoose.Types.ObjectId(),
    email: "test@student.com",
    role: "Student",
  };

  payload.password = await passwordService.hash("1234");
  let student = await Student.create(payload);

  await student.save();

  payload._id = student._id;

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.loginTeacher = async () => {
  // Build a JWT payload.  { id, email }
  const payload: any = {
    name: "test teacher",
    _id: new mongoose.Types.ObjectId(),
    email: "test@teacher.com",
    role: "Teacher",
  };

  payload.password = await passwordService.hash("1234");

  let teacher = await Teacher.create(payload);

  await teacher.save();

  payload._id = teacher._id;

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.loginSchool = async () => {
  // Build a JWT payload.  { id, email }
  const payload: any = {
    name: "test school",
    _id: new mongoose.Types.ObjectId(),
    email: "test.admin@school.com",
    role: "School",
    adminName: "test admin",
    schoolName: "test school",
    adminTitle: "mr",
    country: "Nigeria",
  };

  payload.password = await passwordService.hash("1234");

  let school = await SchoolAdmin.create(payload);

  await school.save();

  payload._id = school._id;

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.loginAdmin = async () => {
  // Build a JWT payload.  { id, email }

  const payload: any = {
    name: "test admin",
    _id: new mongoose.Types.ObjectId().toHexString(),
    userName: "test adminUsername",
    email: "test@superadmin.com",
    role: "SuperAdmin",
  };

  payload.password = await passwordService.hash("1234");

  let admin = await SuperAdmin.create(payload);

  await admin.save();

  payload._id = admin._id;

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.baseURL = `/api`;
