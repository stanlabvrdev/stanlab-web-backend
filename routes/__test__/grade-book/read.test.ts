import request from "supertest";
import app from "../../../app";

import { createClass, createExperiment, createScore } from "./mock";

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
