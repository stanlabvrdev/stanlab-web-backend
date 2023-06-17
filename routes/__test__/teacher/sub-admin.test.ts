import request from "supertest";
import app from "../../../app";
import {
  makeSubAdmin,
  createSchool,
  createClass,
  AdminCreateTeacher,
} from "../../../test/school";
import { SchoolAdmin } from "../../../models/schoolAdmin";
import jwt from "jsonwebtoken";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers`;

it("should create a school class", async () => {
  const school = await createSchool();

  let body = {
    name: "Pete test",
    email: "pete@test.com",
  };

  let teacher = await AdminCreateTeacher(body, school._id);
  teacher = await makeSubAdmin(teacher._id, school._id);

  console.log(teacher);

  const payload: any = {
    name: teacher.name,
    _id: teacher._id,
    email: teacher.email,
    role: teacher.role,
  };

  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // let teacher = await global.loginTeacher();
  // console.log("teacher", teacher);

  // let token = teacher.token;

  // // let ss = await SchoolAdmin.findById({ _id: subAdmin.subAdmin})

  const res = await request(app)
    .post(`${url}/create-school-class`)
    .set("x-auth-token", token)
    .send({
      title: "CHM test",
      subject: "chemistry",
      colour: "red",
    });

  // // console.log("school", school);
  // console.log("subAdmin", subAdmin);
  console.log("token", token);
  console.log("res", res.body);
});
