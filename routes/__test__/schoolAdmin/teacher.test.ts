import request from "supertest";
import app from "../../../app";
import { AdminCreateTeacher } from "../../../test/school";
import { SchoolTeacher } from "../../../models/schoolTeacher";
import { Profile } from "../../../models/profile";

const baseURL = global.baseURL;

const url = `${baseURL}/schools`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).post(`${url}/teachers`).send({}).expect(401);
});

it("should create a school teacher", async () => {
  const school = await global.loginSchool();
  let body = { name: "test teacher", email: "teacher@school.com" };
  await AdminCreateTeacher(body, school._id);

  const res = await request(app)
    .post(`${url}/teachers`)
    .set("x-auth-token", school.token)
    .send({
      name: "test teacher",
      email: "schoolTeacher@school.com",
    });

  const schoolTeacher = await SchoolTeacher.findOne({
    school: school._id,
  });

  const profile = await Profile.findOne({
    selectedSchool: school._id,
  });

  expect(res.statusCode).toBe(201);
  expect(res.body.data).toBe(null);
  expect(schoolTeacher).toBeDefined();
  expect(schoolTeacher.school.toString()).toBe(school._id.toString());
  expect(profile).toBeDefined();
  expect(profile.selectedSchool.toString()).toBe(school._id.toString());
});

it("should remove a teacher", async () => {
  const school = await global.loginSchool();

  let body = { name: "teacher test", email: "test@teacher.com" };
  let teacher = await AdminCreateTeacher(body, school._id);

  const res = await request(app)
    .delete(`${url}/remove-teachers`)
    .set("x-auth-token", school.token)
    .send({
      teacherId: [teacher._id],
    });

  console.log(res)

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBe(null);
  expect(res.body.message).toBe("teachers removed sucessfully");
});
