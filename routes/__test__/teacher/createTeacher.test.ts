import request from "supertest";
import app from "../../../app";
import { createTeacher } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers`;

it("should create a teacher", async () => {
  let body = {
    name: "test teacher",
    email: "teacher@teacher.com",
    password: "12345",
  };
  await createTeacher(body);

  const res = await request(app).post(url).send({
    name: "test teacher",
    email: "schoolTeacher@school.com",
    password: "12345",
  });

  expect(res.statusCode).toBe(200);
});
