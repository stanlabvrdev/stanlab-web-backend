import request from "supertest";
import app from "../../../app";
import "jest";
import { createAssignment } from "../../../test/topical-questions";
import { createTopicalMcqNotification } from "../../../services/student/notification";
import { createClass } from "../../../test/teacher";
import { describe, it, expect } from "@jest/globals";

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

  describe("GET /v2/students/mcq-assignments - Get Assignments", () => {
    it("should return properly formatted assignments", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      await createAssignment(teacher._id, student._id); // Creates a pending assignment
      await createAssignment(teacher._id, student._id, undefined, new Date()); //Creates expired assignment
      await createAssignment(teacher._id, student._id, 90); //Creates assignment with a submission
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments`).set("x-auth-token", student.token);

      expect(response.statusCode).toBe(200);
      expect(response.body.data).toHaveProperty("pending");
      expect(response.body.data).toHaveProperty("expired");
      expect(response.body.data).toHaveProperty("submitted");
      expect(response.body.data.pending).not.toHaveLength(0);
      expect(response.body.data.expired).not.toHaveLength(0);
      expect(response.body.data.submitted).not.toHaveLength(0);
    });
  });

  describe("POST /v2/students/:id - Make a submission", () => {
    it("should throw an error if assignment is not found", async () => {
      const student = await global.loginStudent();
      const response = await request(app)
        .post(`${baseURL}/v2/students/mcq-assignments/60aae530b4fb6a001f4e93cc`)
        .set("x-auth-token", student.token)
        .send({
          submission: [{ _id: "60aae530b4fb6a001f4e93cc", choice: "choice" }],
        });

      expect(response.body.data).toBe(null);
      expect(response.statusCode).toBe(404);
      expect(response.body.message).toEqual("Assignment not found");
    });

    it("should throw an error if assignment has expired ", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id, undefined, new Date());

      const response = await request(app)
        .post(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`)
        .set("x-auth-token", student.token)
        .send({
          submission: [{ _id: "60aae530b4fb6a001f4e93cc", choice: "choice" }],
        });

      expect(response.body.data).toBe(null);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Assignment expired, cannot make a submission");
    });

    it("should throw an error if assignment type = test and student has already submitted ", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id, 60);

      const response = await request(app)
        .post(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`)
        .set("x-auth-token", student.token)
        .send({
          submission: [{ _id: "60aae530b4fb6a001f4e93cc", choice: "choice" }],
        });

      expect(response.body.data).toBe(null);
      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("Already submitted");
    });

    it("should make submission with valid payload", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const assignment = await createAssignment(teacher._id, student._id);

      const getCorrectOption = assignment.questions![0].options.find((option) => {
        return option.isCorrect;
      });
      const response = await request(app)
        .post(`${baseURL}/v2/students/mcq-assignments/${assignment._id}`)
        .set("x-auth-token", student.token)
        .send({
          submission: [{ _id: assignment.questions![0]._id, choice: getCorrectOption["answer"] }],
        });

      expect(response.body.data).toHaveProperty("studentScore");
      expect(response.body.data).toHaveProperty("maxScore");
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Score saved successfully");
    });
  });
  describe("GET /v2/students/mcq-assignments/:id/scores - Get assignment scores by class", () => {
    it("should return a error if there are no graded assignments at that time", async () => {
      const student = await global.loginStudent();
      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/60aae530b4fb6a001f4e93cc/scores`).set("x-auth-token", student.token);

      expect(response.statusCode).toBe(404);
      expect(response.body.data).toBe(null);
      expect(response.body.message).toBe("No graded assignments at this moment");
    });

    it("should return student's scores based on selected class", async () => {
      const teacher = await global.loginTeacher();
      const student = await global.loginStudent();
      const teacherClass = await createClass(teacher._id);
      const createAssignments = async () => {
        for (let i = 0; i < 4; i++) {
          const randomScore = Math.floor(Math.random() * 101);
          const assignment = await createAssignment(teacher._id, student._id, randomScore);
          assignment.classId = teacherClass._id;
          await assignment.save();
        }
      };
      await createAssignments();

      const response = await request(app).get(`${baseURL}/v2/students/mcq-assignments/${teacherClass._id}/scores`).set("x-auth-token", student.token);
      console.log(response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toBe("Score fetched successfully");
      expect(response.body.data).not.toHaveLength(0);
      expect(response.body.data[0]).toHaveProperty("subject");
      expect(response.body.data[0]).toHaveProperty("scores");
    });
  });
});
