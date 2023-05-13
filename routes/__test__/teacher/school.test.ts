import request from "supertest";
import app from "../../../app";
import { createTeacherSchool } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers/schools`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(url).send({}).expect(401);
});

it("should return schools", async () => {
  const teacher = global.loginTeacher();
  await createTeacherSchool(teacher._id);

  const res = await request(app).get(url).set("x-auth-token", teacher.token).send({});

  expect(res.statusCode).toBe(200);
  const data = res.body.data;
  expect(data).toBeDefined();
  expect(data[0].teacher).toBe(teacher._id);
  expect(data[0].school).toBeDefined();
});
