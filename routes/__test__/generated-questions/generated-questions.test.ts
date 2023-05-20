import request from "supertest";
import app from "../../../app";
import "jest";
import { fakeMCQQuestions, fakeTOFQuestions } from "./data";
import { GeneratedQuestions } from "../../../models/generated-questions";

const baseURL = global.baseURL;

const url = `${baseURL}/v2/ai/questions/`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(url).send({}).expect(401);
});

const performSaveOperation = async (type: string) => {
  let savedQuestions: any;
  const teacher = await global.loginTeacher();
  if (type === "MCQ") {
    savedQuestions = await GeneratedQuestions.insertMany(fakeMCQQuestions, { rawResult: false });
  } else if (type === "TOF") {
    savedQuestions = await GeneratedQuestions.insertMany(fakeTOFQuestions, { rawResult: false });
  }

  const res = await request(app).post(url).set("x-auth-token", teacher.token).send({
    questions: savedQuestions,
    subject: "Biology",
    topic: "Pollination",
  });

  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty("message", "Questions saved to 'Question bank'");

  const data = res.body.data;
  expect(data).toHaveProperty("questions");
  expect(data.questions).toBeInstanceOf(Array);
  expect(data.questions.length).toBeGreaterThan(0); // Ensure questions array is not empty

  expect(data).toHaveProperty("_id");
  expect(data).toHaveProperty("teacher");
  expect(data).toHaveProperty("subject");
  expect(data).toHaveProperty("topic");
};

it("should save MCQ questions with valid payload", async () => {
  await performSaveOperation("MCQ");
});

it("should save TOF questions with valid payload", async () => {
  await performSaveOperation("TOF");
});
