import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

import jwt from "jsonwebtoken";

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

global.loginStudent = () => {
  // Build a JWT payload.  { id, email }
  const payload = {
    _id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@student.com",
    role: "Student",
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.loginTeacher = () => {
  // Build a JWT payload.  { id, email }
  const payload = {
    _id: new mongoose.Types.ObjectId().toHexString(),
    email: "test@teacher.com",
    role: "Teacher",
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  return {
    ...payload,
    token,
  };
};

global.baseURL = `/api`;
