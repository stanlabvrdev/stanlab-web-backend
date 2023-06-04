import request from "supertest";
import app from "../../../app";

import { createLab } from "./data";

const baseURL = global.baseURL;

const url = `${baseURL}/system-experiments/lab/teacher-labs`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(url).send({}).expect(401);
});

it("should return array of labs", async () => {
  const teacher = await global.loginTeacher();

  const student = await global.loginStudent();

  const lab = await createLab(teacher._id, true, student._id);
  const res = await request(app).get(url).query({ is_completed: false }).set("x-auth-token", teacher.token);

  expect(res.statusCode).toBe(200);
  const data = res.body.data;
  expect(data.length).toBe(1);

  expect(data[0]._id).toBe(lab._id.toString());
  expect(data[0].teacher._id).toBe(teacher._id.toString());
  expect(data[0].student._id).toBe(student._id.toString());
  expect(data[0].classId._id).toBeDefined();
  expect(data[0].classId.title).toBeDefined();
  expect(data[0].classId.subject).toBeDefined();
  expect(data[0].classId.section).toBeDefined();
});
