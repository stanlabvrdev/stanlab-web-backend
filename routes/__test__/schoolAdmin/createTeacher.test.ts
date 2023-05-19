import request from "supertest";
import app from "../../../app";
import { AdminCreateTeacher } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/schools/teachers`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).post(url).send({}).expect(401);
});

it("should create a school teacher", async () => {
  const school = await global.loginSchool();
  let body = { name: "test teacher", email: "teacher@school.com" };
  await AdminCreateTeacher(body, school._id);

  const res = await request(app)
    .post(url)
    .set("x-auth-token", school.token)
    .send({
      name: "test teacher",
      email: "schoolTeacher@school.com",
    });

  expect(res.statusCode).toBe(201);
});
