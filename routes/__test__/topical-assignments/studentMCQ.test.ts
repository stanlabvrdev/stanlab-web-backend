import request from "supertest";
import app from "../../../app";
import "jest";
import { createAssignment } from "../../../test/topical-questions";
import { createTopicalMcqNotification } from "../../../services/student/notification";

const baseURL = global.baseURL;

describe("Student Assignment Service endpoints", () => {
  describe("GET /v2/students Get an assignment", () => {
    it("can only be accessed if student is signed in", async () => {
      await request(app).get(`${baseURL}/v2/students/mcq-assignments/60aae530b4fb6a001f4e93cc`).send({}).expect(401);
    });

    it("should throw an error if assignment is not found", async () => {
      const student = await global.loginStudent();
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/60aae530b4fb6a001f4e93cc`).set("x-auth-token", student.token);

      expect(response.body.data).toBe(null);
      expect(response.body.message).toEqual("Assignment not found");
    });

    it("should throw an error if assignment has expired", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id, undefined, new Date());
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`).set("x-auth-token", student.token);
      expect(response.body.data).toBe(null);
      expect(response.body.message).toBe("Assignment expired!");
    });

    it("should throw an error if it is a test assignment and student has already made a submission", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id, 60);
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`).set("x-auth-token", student.token);

      expect(response.body.data).toBe(null);
      expect(response.body.message).toBe("Multiple attempts are not allowed for this type of assignment");
    });

    it("should create an assignment with valid payload", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id);
      await createTopicalMcqNotification(student._id, assignment._id);
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`).set("x-auth-token", student.token);

      expect(response.body.message).toBe("Assignment fetched successfully");
      expect(response.body.data).toHaveProperty("questions");
      expect(response.body.data.questions[0].options[0].isCorrect).toBeUndefined();
    });
  });
});
