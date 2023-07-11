import request from "supertest";
import app from "../../../app";
import "jest";
import { fakeMCQData, randoPassage } from "../generated-questions/data";
import axios from "axios";
import { createClass } from "../../../test/teacher";
import { createQuestionGroup } from "../../../test/topical-questions";
import { createStudent } from "../../../test/school";

const baseURL = global.baseURL;
const assignNowEndpoint = `${baseURL}/v2/ai/questions/assign-now`;
const assignLaterEndpoint = `${baseURL}/v2/ai/questions/assign-later`;

interface TestDetails {
  questGroupId?: string;
  questions?: any;
  type: string;
  duration?: number;
  startDate: Date;
  subject: string;
  dueDate: Date;
  instructions?: string;
  comments?: string;
  classID: string;
  topic: string;
}

const generateQuestions = async (token: string) => {
  jest.spyOn(axios, "post").mockResolvedValueOnce(fakeMCQData);
  const res = await request(app).post(`${baseURL}/v2/ai/questions/text-generate`).set("x-auth-token", token).send({
    text: randoPassage,
    type: "MCQ",
  });

  return res.body.data;
};

const testError = async (endpoint: string, testDetails: TestDetails, token: string, expectedStatusCode: number, expectedMessage: string) => {
  const res = await request(app).post(endpoint).set("x-auth-token", token).send(testDetails);

  expect(res.statusCode).toBe(expectedStatusCode);
  expect(res.body.message).toEqual(expectedMessage);
};

const testInvalidAssignmentDetails = async (endpoint: string, testDetails: TestDetails, token: string) => {
  await testError(endpoint, testDetails, token, 400, "Enter a valid test duration");
};

const testSavingQuestions = async (endpoint: string, testDetails: TestDetails, token: string) => {
  await testError(endpoint, testDetails, token, 400, "Cannot save questions");
};

const testQuestionsNotFound = async (endpoint: string, testDetails: TestDetails, token: string) => {
  await testError(endpoint, testDetails, token, 404, "Questions not found");
};

const testClassNotFound = async (endpoint: string, testDetails: TestDetails, token: string) => {
  await testError(endpoint, testDetails, token, 404, "Class not found");
};

const testNoStudentInClass = async (endpoint: string, testDetails: TestDetails, token: string) => {
  await testError(endpoint, testDetails, token, 404, "No student in this class");
};

const testCreateAssignment = async (endpoint: string, testDetails: TestDetails, token: string) => {
  const res = await request(app).post(endpoint).set("x-auth-token", token).send(testDetails);
  expect(res.statusCode).toBe(201);
  expect(res.body.message).toEqual("Topical assignment assigned");
  expect(res.body.data).not.toBeNull();
  expect(res.body.data).toHaveProperty("type");
  expect(res.body.data).toHaveProperty("_id");
};

const generateTestData = async (classID: string, questions?: any, questGroupId?: string): Promise<TestDetails> => {
  const testData: TestDetails = {
    questGroupId,
    questions,
    type: "Test",
    startDate: new Date(),
    dueDate: new Date(),
    classID,
    subject: "Biology",
    topic: "Pollination",
    duration: 3000,
  };

  return testData;
};

describe("Assign Topical assignments endpoints", () => {
  describe("POST /v2/ai/questions/assign-now - ASSIGN NOW", () => {
    it("can only be accessed if teacher is signed in", async () => {
      await request(app).get(assignNowEndpoint).send({}).expect(401);
    });

    it("should throw an error for invalid test details", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const questions = await generateQuestions(teacher.token);
      const testData = await generateTestData(teacherClass._id, questions);
      testData.duration = undefined;
      await testInvalidAssignmentDetails(assignNowEndpoint, testData, teacher.token);
    });

    it("should throw an error if question data is malformed and cannot be saved", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const testData = await generateTestData(teacherClass._id);
      testData.questions = [];

      await testSavingQuestions(assignNowEndpoint, testData, teacher.token);
    });

    it("should throw an error if class is not found", async () => {
      const teacher = await global.loginTeacher();
      const questions = await generateQuestions(teacher.token);
      const testData = await generateTestData("647faa5158df042e10528442", questions);

      await testClassNotFound(assignNowEndpoint, testData, teacher.token);
    });

    it("should throw an error if there are no students in the class", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const questions = await generateQuestions(teacher.token);
      const testData = await generateTestData(teacherClass._id, questions);

      await testNoStudentInClass(assignNowEndpoint, testData, teacher.token);
    });

    it("should create the assignment with valid details", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const student = await createStudent("Muhammadu Buhari");
      teacherClass.students.push(student._id);
      teacherClass.save();
      const questions = await generateQuestions(teacher.token);
      const testData = await generateTestData(teacherClass._id, questions);

      await testCreateAssignment(assignNowEndpoint, testData, teacher.token);
    });
  });

  describe("POST /v2/ai/questions/assign-later - ASSIGN LATER", () => {
    it("can only be accessed if teacher is signed in", async () => {
      await request(app).get(assignLaterEndpoint).send({}).expect(401);
    });

    it("should throw an error for invalid test details", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const questGroup = await createQuestionGroup(teacher._id);
      const testData = await generateTestData(teacherClass._id, undefined, questGroup._id);
      testData.duration = undefined;
      await testInvalidAssignmentDetails(assignLaterEndpoint, testData, teacher.token);
    });

    it("should throw an error if questions are not found", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const testData = await generateTestData(teacherClass._id, undefined, "647faa5158df042e10528442");
      testData.questions = [];

      await testQuestionsNotFound(assignLaterEndpoint, testData, teacher.token);
    });

    it("should throw an error if class is not found", async () => {
      const teacher = await global.loginTeacher();
      const questGroup = await createQuestionGroup(teacher._id);
      const testData = await generateTestData("647faa5158df042e10528442", undefined, questGroup._id);

      await testClassNotFound(assignLaterEndpoint, testData, teacher.token);
    });

    it("should throw an error if there are no students in the class", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const questGroup = await createQuestionGroup(teacher._id);
      const testData = await generateTestData(teacherClass._id, undefined, questGroup._id);

      await testNoStudentInClass(assignLaterEndpoint, testData, teacher.token);
    });

    it("should create the assignment with valid details", async () => {
      const teacher = await global.loginTeacher();
      const teacherClass = await createClass(teacher._id);
      const student = await createStudent("Muhammadu Buhari");
      teacherClass.students.push(student._id);
      teacherClass.save();
      const questGroup = await createQuestionGroup(teacher._id);
      const testData = await generateTestData(teacherClass._id, undefined, questGroup._id);

      await testCreateAssignment(assignLaterEndpoint, testData, teacher.token);
    });
  });
});
