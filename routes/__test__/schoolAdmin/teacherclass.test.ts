import request from "supertest";
import app from "../../../app";
import { TeacherClass } from "../../../models/teacherClass";
import { createClass } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/schools/classes`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).post(url).send({}).expect(401);
});

it("should create a class", async () => {
  const school = await global.loginSchool();

  const res = await request(app)
    .post(url)
    .set("x-auth-token", school.token)
    .send({
      title: "CHM 201",
      subject: "Chemistry",
      section: "Electrolysis",
      colour: "blue",
    });

  const teacherClass = await TeacherClass.findOne({
    school: school._id,
  });
  expect(teacherClass).toBeDefined();
  expect(teacherClass.school.toString()).toBe(school._id.toString());
  expect(res.statusCode).toBe(201);
  expect(res.body).toBeDefined();
  expect(res.body.message).toBe("class created sucessfully");
});

it("should get classes", async () => {
  const school = await global.loginSchool();

  await createClass(school._id);

  const res = await request(app)
    .get(url)
    .set("x-auth-token", school.token)
    .send({});

  expect(res.statusCode).toBe(200);
  expect(res.body).toBeDefined();
  expect(res.body.message).toBe("class successfully fetched");
});

it("should get a class by Id", async () => {
  const school = await global.loginSchool();

  const teacherClass = await createClass(school._id);

  const res = await request(app)
    .get(`${url}/${teacherClass._id}`)
    .set("x-auth-token", school.token)
    .send();

  expect(res.statusCode).toBe(200);
  expect(res.body).toBeDefined();
  expect(res.body.message).toBe("class successfully fetched");
});

it("should update a class", async () => {
  const school = await global.loginSchool();

  const teacherClass = await createClass(school._id);

  const res = await request(app)
    .put(`${url}/${teacherClass._id}`)
    .set("x-auth-token", school.token)
    .send({
      title: "PHY 201",
      subject: "Physics",
      section: "Magnetism",
      colour: "white",
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBe(null);
  expect(res.body.message).toBe("class updated sucessfully");
});
