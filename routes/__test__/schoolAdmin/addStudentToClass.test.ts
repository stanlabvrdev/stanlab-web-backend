import request from "supertest";
import app from "../../../app";
import { addStudentToClass, createClass } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/schools/classes/:classId/student`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).put(url).send({}).expect(401);
});

it("should create a student and add them to the class", async () => {
  const school = await global.loginSchool();
  const teacherClass = await createClass();
  let name = "test student";

  await addStudentToClass(school._id, teacherClass._id, name);

  const res = await request(app)
    .put(`${baseURL}/schools/classes/${teacherClass._id}/student`)
    .set("x-auth-token", school.token)
    .send({
      name,
    });

  expect(res.statusCode).toBe(200);
});
