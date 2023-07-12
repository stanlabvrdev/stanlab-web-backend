import request from "supertest";
import app from "../../../app";
import "jest";
import { randoPassage, fakeMCQData, fakeTOFData } from "./data";
import axios from "axios";
import env from "../../../config/env";
import { expect, jest, it } from "@jest/globals";

const { question_generation_model: QUESTION_GENERATION_MODEL, true_or_false_model: TRUE_OR_FALSE_MODEL } = env.getAll();
const baseURL = global.baseURL;

const texturl = `${baseURL}/v2/ai/questions/text-generate`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(texturl).send({}).expect(401);
});

it("should return an error message if correct type is not specified", async () => {
  const teacher = await global.loginTeacher();
  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: randoPassage,
  });

  expect(res.statusCode).toBe(400);
  expect(res.body.data).toBe(null);
  expect(res.body.message).toBe("Invalid question type");
});

const fetchQuestions = async (teacher: any, type: string, model: string, data: any) => {
  jest.spyOn(axios, "post").mockResolvedValueOnce(data);

  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: randoPassage,
    type,
  });

  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.data)).toBe(true);
  expect(res.body.message).toBe("Questions generated successfully");
  expect(res.body.data.length).toBeGreaterThan(0);

  if (type === "MCQ") {
    expect(res.body.data[0].question).toBeDefined();
    expect(axios.post).toHaveBeenCalledWith(model, {
      text: randoPassage,
      type: "mcq",
    });
  } else if (type === "TOF") {
    expect(res.body.data[0].question).toBeUndefined();
    expect(axios.post).toHaveBeenCalledWith(model, {
      text: randoPassage,
    });
  }
};

it("should fetch MCQ questions", async () => {
  const teacher = await global.loginTeacher();
  await fetchQuestions(teacher, "MCQ", QUESTION_GENERATION_MODEL!, fakeMCQData);
});

it("should fetch TOF questions", async () => {
  const teacher = await global.loginTeacher();
  await fetchQuestions(teacher, "TOF", TRUE_OR_FALSE_MODEL!, fakeTOFData);
});

it("should return an error for empty TOF model response", async () => {
  const teacher = await global.loginTeacher();

  jest.spyOn(axios, "post").mockResolvedValueOnce({ data: [] });
  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: randoPassage,
    type: "TOF",
  });

  expect(res.statusCode).toBe(500);
  expect(res.body.message).toBe("Question Generation unsuccessful");
  expect(res.body.data).toBe(null);
});

it("should return an error for empty MCQ model response", async () => {
  const teacher = await global.loginTeacher();

  jest.spyOn(axios, "post").mockResolvedValueOnce({ data: { questions: [] } });
  const res = await request(app).post(texturl).set("x-auth-token", teacher.token).send({
    text: randoPassage,
    type: "MCQ",
  });

  expect(res.statusCode).toBe(500);
  expect(res.body.message).toBe("Question Generation unsuccessful");
  expect(res.body.data).toBe(null);
});
