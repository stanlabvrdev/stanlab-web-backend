import request from "supertest";
import app from "../../../app";
import { AdminCreateTeacher, updateSchool } from "../../../test/school";
import { Teacher } from "../../../models/teacher";

const baseURL = global.baseURL;

const url = `${baseURL}/schools`;

it("should create a school admin profile", async () => {
  const res = await request(app).post(url).send({
    school_name: "Rainbow Collage",
    admin_email: "jane.doe@rainbow.com",
    admin_name: "Jane Doe",
    admin_title: "mrs",
    password: "12345",
    country: "Rome",
  });

  expect(res.statusCode).toBe(200);
  expect(res.body).toBeDefined();
});

it("can only be accessed if admin is signed in", async () => {
  await request(app).put(url).send({}).expect(401);
});

it("should update a school admin profile", async () => {
  const school = await global.loginSchool();

  let body = {
    school_name: "Boys Collage",
    admin_email: "koladefgbc@yopmail.com",
    admin_name: "John Doe",
    admin_title: "mr",
    password: "54321",
    country: "Nigeria",
  };

  await updateSchool(body, school._id);

  const res = await request(app)
    .put(url)
    .set("x-auth-token", school.token)
    .send({
      school_name: "Queens Collage",
      admin_email: "jane.qqueens@yopmail.com",
      admin_name: "Jane Doe",
      admin_title: "mrs",
      password: "12345",
      country: "Rome",
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.data._id).toBe(school._id.toString());
});

it("should make a teacher sub-admin", async () => {
  const school = await global.loginSchool();

  let body = {
    name: "Jinja test",
    email: "jinja@test.com",
  };

  let teacher = await AdminCreateTeacher(body, school._id);

  const res = await request(app)
    .put(`${url}/teachers/${teacher._id}`)
    .set("x-auth-token", school.token);

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("sub admin assigned sucessfully");
  expect(res.body.data).toBe(null);
});
