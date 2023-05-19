import request from "supertest";
import app from "../../../app";
import { addStudentToClass, createClass } from "../../../test/school";
import { SchoolStudent } from "../../../models/schoolStudent";
import { StudentSubscription } from "../../../models/student-subscription";

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

  const schoolStudent = await SchoolStudent.findOne({
    school: school._id,
  });

  const subscribe = await StudentSubscription.findOne({
    school: school._id,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBe(null);
  expect(schoolStudent).toBeDefined();
  expect(schoolStudent.school.toString()).toBe(school._id.toString());
  expect(subscribe).toBeDefined();
  expect(subscribe.school.toString()).toBe(school._id.toString());
});
