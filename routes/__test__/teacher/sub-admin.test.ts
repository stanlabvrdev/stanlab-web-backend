import request from "supertest";
import app from "../../../app";
import {
  makeSubAdmin,
  createClass,
  addStudentToClass,
  AdminCreateTeacher,
} from "../../../test/school";
import jwt from "jsonwebtoken";
import { TeacherClass } from "../../../models/teacherClass";
import { SchoolStudent } from "../../../models/schoolStudent";
import { SchoolTeacher } from "../../../models/schoolTeacher";
import { Profile } from "../../../models/profile";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers`;

it("can only be accessed if teacher is signed in", async () => {
  await request(app).post(`${url}/create-school-class`).send({}).expect(401);
});
it("can only be accessed if teacher is signed in", async () => {
  await request(app)
    .put(`${url}/class-school-student/:classId`)
    .send({})
    .expect(401);
});
it("can only be accessed if teacher is signed in", async () => {
  await request(app).post(`${url}/school-teacher`).send({}).expect(401);
});
it("can only be accessed if teacher is signed in", async () => {
  await request(app).post(`${url}/school-teacher-bulk`).send({}).expect(401);
});

it("should create a school class", async () => {
  let teacher = await makeSubAdmin();

  const payload: any = {
    name: teacher.name,
    _id: teacher._id,
    email: teacher.email,
    role: "Teacher",
    password: teacher.password,
    subAdmin: teacher.subAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_KEY!);

  const res = await request(app)
    .post(`${url}/create-school-class`)
    .set("x-auth-token", token)
    .send({
      title: "CHM test",
      subject: "chemistry",
      colour: "red",
    });

  const teacherClass = await TeacherClass.findOne({
    school: teacher.subAdmin,
  });

  expect(teacherClass).toBeDefined();
  expect(teacherClass.school.toString()).toBe(teacher.subAdmin.toString());
  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeDefined();
  expect(res.body.message).toBe("class created successfully");
});

it("should add a student to a school class", async () => {
  let teacher = await makeSubAdmin();

  const payload: any = {
    name: teacher.name,
    _id: teacher._id,
    email: teacher.email,
    role: "Teacher",
    password: teacher.password,
    subAdmin: teacher.subAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_KEY!);

  const teacherClass = await createClass(teacher.subAdmin);
  let name = "test student";

  await addStudentToClass(teacher.subAdmin, teacherClass._id, name);

  const res = await request(app)
    .put(`${url}/class-school-student/${teacherClass._id}`)
    .set("x-auth-token", token)
    .send({
      name,
    });

  const schoolStudent = await SchoolStudent.findOne({
    school: teacher.subAdmin,
  });

  expect(schoolStudent).toBeDefined();
  expect(schoolStudent.school.toString()).toBe(teacher.subAdmin.toString());
  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBe(null);
  expect(res.body.message).toBe("student added to class sucessfully");
});

it("should create a school teacher", async () => {
  let teacher = await makeSubAdmin();

  const payload: any = {
    name: teacher.name,
    _id: teacher._id,
    email: teacher.email,
    role: "Teacher",
    password: teacher.password,
    subAdmin: teacher.subAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_KEY!);

  let body = { name: "test teacher", email: "teacher@school.com" };
  await AdminCreateTeacher(body, teacher.subAdmin);

  const res = await request(app)
    .post(`${url}/school-teacher`)
    .set("x-auth-token", token)
    .send({
      name: "test teacher",
      email: "pep@teacher.com",
    });

  const schoolTeacher = await SchoolTeacher.findOne({
    school: teacher.subAdmin,
  });

  const profile = await Profile.findOne({
    selectedSchool: teacher.subAdmin,
  });

  expect(res.statusCode).toBe(201);
  expect(res.body.data).toBe(null);
  expect(schoolTeacher).toBeDefined();
  expect(schoolTeacher.school.toString()).toBe(teacher.subAdmin.toString());
  expect(profile).toBeDefined();
  expect(profile.selectedSchool.toString()).toBe(teacher.subAdmin.toString());
  expect(res.body.message).toBe("invitation sent sucessfully");
});
