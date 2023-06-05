import request from "supertest";
import app from "../../../app";
import "jest";
import { fakeMCQQuestions, fakeTOFQuestions } from "./data";
import { GeneratedQuestions } from "../../../models/generated-questions";
import { createQuestionGroup } from "../../../test/topical-questions";

const baseURL = global.baseURL;

const url = `${baseURL}/v2/ai/questions/`;

describe("Question Group ENDPOINTS", () => {
  describe("SAVE /v2/ai/questions/", () => {
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
  });

  describe("GET /v2/ai/questions/", () => {
    it("should get question groups for the logged in teacher", async () => {
      const teacher = await global.loginTeacher();
      await createQuestionGroup(teacher._id);
      const res = await request(app).get(url).query({ teacher: teacher._id }).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Successful");
      expect(res.body.data[0].teacher).toEqual(teacher._id.toString());
    });

    it("should return message if teacher has no saved questions", async () => {
      const teacher = await global.loginTeacher();
      const res = await request(app).get(url).query({ teacher: teacher._id }).set("x-auth-token", teacher.token);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("You have no saved questions");
    });
  });

  describe("DELETE /v2/ai/questions/:id", () => {
    it("should delete a question group if it was created by the logged in teacher", async () => {
      const teacher = await global.loginTeacher();
      const questionGroup = await createQuestionGroup(teacher._id);
      const id = questionGroup._id;
      const newUrl = `${url}/${id}`;
      const res = await request(app).delete(newUrl).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Deleted Successfully");
      expect(res.body.data).toBe(null);
    });

    it("should return a message if the resource is not found", async () => {
      const teacher = await global.loginTeacher();
      const newUrl = `${url}/60aae530b4fb6a001f4e93cc`;
      const res = await request(app).delete(newUrl).set("x-auth-token", teacher.token);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Resource not found");
      expect(res.body.data).toBe(null);
    });
  });

  describe("GET /v2/ai/questions/:id", () => {
    it("should get questions of a question group", async () => {
      const teacher = await global.loginTeacher();
      const questionGroup = await createQuestionGroup(teacher._id);
      const id = questionGroup._id;
      const newUrl = `${url}/${id}`;

      const res = await request(app).get(newUrl).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Successful");
      expect(res.body.data.questions).toBeInstanceOf(Array);
      expect(res.body.data.teacher).toEqual(teacher._id.toString());
    });
    it("should return a message if the resource is not found", async () => {
      const teacher = await global.loginTeacher();
      const newUrl = `${url}/60aae530b4fb6a001f4e93cc`;
      const res = await request(app).get(newUrl).set("x-auth-token", teacher.token);
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Questions, Not found");
    });
  });

  describe("EDIT /v2/ai/questions/:id", () => {
    it("should edit details of a question group", async () => {
      const teacher = await global.loginTeacher();
      const questionGroup = await createQuestionGroup(teacher._id);
      const id = questionGroup._id;
      const newUrl = `${url}/${id}`;
      const res = await request(app).put(newUrl).set("x-auth-token", teacher.token).send({
        questions: questionGroup.questions,
        subject: "Physics",
        topic: "Electromagnetism",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Update successful");
      expect(res.body.data.questions).toBeInstanceOf(Array);
      expect(res.body.data.teacher).toEqual(teacher._id.toString());
    });
    it("should return a message if the resource is not found", async () => {
      const teacher = await global.loginTeacher();
      const newUrl = `${url}/60aae530b4fb6a001f4e93cc`;
      const questionGroup = await createQuestionGroup(teacher._id);
      const res = await request(app).put(newUrl).set("x-auth-token", teacher.token).send({
        questions: questionGroup.questions,
        subject: "Physics",
        topic: "Electromagnetism",
      });
      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Resource not found or you are not authorized to edit this resource");
    });
  });
});
