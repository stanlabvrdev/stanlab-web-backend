import request from "supertest";
import app from "../../../app";
import "jest";
import { sampleText, data, tfData } from "./data";
import axios from "axios";
import env from "../../../config/env";
const { question_generation_model: QUESTION_GENERATION_MODEL, true_or_false_model: TRUE_OR_FALSE_MODEL } = env.getAll();
const baseURL = global.baseURL;

const texturl = `${baseURL}/v2/ai/questions/text-generate`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(texturl).send({}).expect(401);
});

it("should return an error message if correct type is not specified", async () => {
  const teacher = await global.loginTeacher();
  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: sampleText,
  });

  expect(res.statusCode).toBe(400);
  expect(res.body.data).toBe(null);
  expect(res.body.message).toBe("Invalid question type");
});

const fetchQuestions = async (teacher: any, type: string, model: string, data: any) => {
  jest.spyOn(axios, "post").mockResolvedValueOnce(data);

  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: sampleText,
    type: type,
  });

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.message).toBe("Questions generated successfully");
  expect(res.body.data.length).toBeGreaterThan(0);

  if (type === "MCQ") {
    expect(res.body.data[0].question).toBeDefined();
    expect(axios.post).toHaveBeenCalledWith(model, {
      context: sampleText,
      option_set: "Wordnet",
    });
  } else if (type === "TOF") {
    expect(res.body.data[0].question).toBeUndefined();
    expect(axios.post).toHaveBeenCalledWith(model, {
      text: sampleText,
    });
  }
};

it("should fetch MCQ questions", async () => {
  const teacher = await global.loginTeacher();
  await fetchQuestions(teacher, "MCQ", QUESTION_GENERATION_MODEL!, data);
});

it("should fetch TOF questions", async () => {
  const teacher = await global.loginTeacher();
  await fetchQuestions(teacher, "TOF", TRUE_OR_FALSE_MODEL!, tfData);
});

const performQuestionGenerationTest = async (type: string) => {
  const teacher = await global.loginTeacher();

  jest.spyOn(axios, "post").mockResolvedValueOnce({ data: [] });

  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: sampleText,
    type: type,
  });

  expect(res.statusCode).toBe(500);
  expect(res.body.message).toBe("Question Generation unsuccessful");
  expect(res.body.data).toBe(null);
};

it("should return an error for empty TOF model response", async () => {
  await performQuestionGenerationTest("TOF");
});

it("should return an error for empty MCQ model response", async () => {
  await performQuestionGenerationTest("MCQ");
});
