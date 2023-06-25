import request from "supertest";
import app from "../../../app";
import { describe, it, expect } from "@jest/globals";
import { createClass as createTeacherClass } from "../../../test/teacher";
import { createAssignment } from "../../../test/topical-questions";

import { createClass, createExperiment, createScore } from "./mock";
import { createStudent } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/v2/grade-book`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(`${url}/12344`).send({}).expect(401);
});

it("should fetch student grades", async () => {
  const teacher = await global.loginTeacher();
  const student = await global.loginStudent();

  const classData = await createClass(teacher._id, student._id);

  const classId = classData.class_data._id;
  const experiment = await createExperiment(teacher._id, classId, student._id);

  await createScore(teacher._id, student._id, classId, experiment._id);

  const res = await request(app).get(`${url}/${classId}`).set("x-auth-token", teacher.token);

  const data = res.body.data;
  expect(data.length).toBe(1);
  expect(data[0].grade.length).toBe(1);
  expect(data[0].student.name).toBe(student.name);
});

describe("TEST Topical Gradebook endpoint", () => {
  const endpoint = `${url}/topical`;

  it("can only be accessed if teacher is signed in", async () => {
    await request(app).get(`${endpoint}/1234`).send({}).expect(401);
  });

  it("should throw an error if an invalid classid is passed", async () => {
    const teacher = await global.loginTeacher();
    await request(app).get(`${endpoint}/1234`).set("x-auth-token", teacher.token).expect(400);
  });

  it("should throw an error if no assignments are found in that class", async () => {
    const teacher = await global.loginTeacher();
    const teacherClass = await createTeacherClass(teacher._id);
    await request(app).get(`${endpoint}/${teacherClass._id}`).set("x-auth-token", teacher.token).expect(404);
  });

  it("should fetch grade data", async () => {
    const teacher = await global.loginTeacher();
    const student = await global.loginStudent();
    const student2 = await createStudent("test student");
    const assignment = await createAssignment(teacher._id, student._id, 90);
    await createAssignment(teacher._id, student2._id, 50);

    const res = await request(app).get(`${endpoint}/${assignment.classId}`).set("x-auth-token", teacher.token);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.message).toEqual("GradeBook Data successfully fetched");
  });
});
