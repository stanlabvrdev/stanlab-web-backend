import request from "supertest";
import app from "../../../app";
import { createClass } from "../../../test/teacher";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers/classes`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(url).send({}).expect(401);
});

it("should return the teacher's classes", async () => {
  const teacher = await global.loginTeacher();

  await createClass(teacher._id);
  const res = await request(app).get(url).set("x-auth-token", teacher.token);

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeDefined();
  expect(res.body.message).toBe("classes fetched sucessfully");
});
