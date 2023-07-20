import request from "supertest";
import app from "../../../app";
import { createLessonPlan, sampleMarkdown } from "./lesson-plan.data";
import { describe, it, expect } from "@jest/globals";
import EventSource from "eventsource";
import mockAxios from "jest-mock-axios";

const baseURL = global.baseURL;
const url = `${baseURL}/v2/lesson-plan/`;

describe("Lesson Plan Routes", () => {
  describe("POST /v2/lesson-plan/", () => {
    it("can only be accessed if teacher is signed in", async () => {
      await request(app).get(url).send({}).expect(401);
    });
  });
  //   describe("POST /v2/lesson-plan/generate", () => {
  //     it("should generate a lesson plan", async () => {
  //       const teacher = await global.loginTeacher();
  //       const mockResponse = {
  //         data: {
  //           choices: [
  //             {
  //               delta: {
  //                 content: sampleMarkdown,
  //               },
  //             },
  //           ],
  //         },
  //       };
  //       mockAxios.post.mockResolvedValue(mockResponse);
  //       const res = await request(app)
  //         .post("/v2/lesson-plan/generate")
  //         .send({
  //           subject: "Biology",
  //           topic: "Pollination",
  //           grade: "Grade 9",
  //         })
  //         .set("x-auth-token", teacher.token);

  //       const eventSource = new EventSource("/v2/lesson-plan/generate");

  //       eventSource.onmessage = (event) => {
  //         // Check the received event
  //         expect(event.data).toBeTruthy();
  //         done();
  //       };
  //       expect(res.status).toBe(200);
  //       expect(res.body.message).toBe("Successful");
  //       // add more assertions based on the expected response
  //     });
  //   });

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
function done() {
  throw new Error("Function not implemented.");
}
