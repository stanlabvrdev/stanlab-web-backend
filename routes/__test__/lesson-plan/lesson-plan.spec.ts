import request from "supertest";
import app from "../../../app";
import { createLessonPlan, sampleMarkdown } from "./lesson-plan.data";
import { describe, it, expect } from "@jest/globals";

const baseURL = global.baseURL;
const url = `${baseURL}/v2/lesson-plan/`;

describe("Lesson Plan Routes", () => {
  describe("POST /v2/lesson-plan/", () => {
    it("can only be accessed if teacher is signed in", async () => {
      await request(app).get(url).send({}).expect(401);
    });
  });

  describe("GET /v2/lesson-plan/", () => {
    it("should get lesson plans for the logged in teacher", async () => {
      const teacher = await global.loginTeacher();
      const res = await request(app).get(url).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
    });
  });

  describe("POST /v2/lesson-plan/", () => {
    it("should save a lesson plan for the logged in teacher", async () => {
      const { token } = await global.loginTeacher(); // login as a teacher
      const res = await request(app)
        .post(url)
        .send({
          subject: "Biology",
          topic: "Pollination",
          grade: "Grade 9",
          lessonPlan: sampleMarkdown,
        })
        .set("x-auth-token", token);

      expect(res.status).toBe(201);
    });

    it("should throw an error if the input is invalid", async () => {
      const { token } = await global.loginTeacher();
      const res = await request(app)
        .post(url)
        .send({
          subject: "Biology",
          topic: "Pollination",
          grade: "Grade 9",
        })
        .set("x-auth-token", token);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /v2/lesson-plan/:id", () => {
    it("should get a lesson plan with the passsed in id", async () => {
      const teacher = await global.loginTeacher();
      const { _id } = await createLessonPlan(teacher._id);
      const res = await request(app).get(`${url}/${_id}`).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.data.teacher.toString()).toEqual(teacher._id.toString());
    });
  });

  describe("PUT /v2/lesson-plan/:id", () => {
    it("should update a lesson plan with the passed in id", async () => {
      const teacher = await global.loginTeacher();
      const { _id, lessonPlan } = await createLessonPlan(teacher._id);
      const updatedLessonPlan = "Updated LessonPlan";
      const res = await request(app).put(`${url}/${_id}`).send({ lessonPlan: updatedLessonPlan }).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.data.teacher.toString()).toEqual(teacher._id.toString());
      expect(res.body.data.lessonPlan).not.toEqual(lessonPlan);
    });
  });

  describe("DELETE /v2/lesson-plan/:id", () => {
    it("should delete a lesson plan with the passsed in id", async () => {
      const teacher = await global.loginTeacher();
      const { _id } = await createLessonPlan(teacher._id);
      const res = await request(app).delete(`${url}/${_id}`).set("x-auth-token", teacher.token);

      expect(res.status).toBe(200);
      expect(res.body.data.teacher.toString()).toEqual(teacher._id.toString());
    });
  });
});
