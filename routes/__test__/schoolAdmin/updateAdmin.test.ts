import request from "supertest";
import app from "../../../app";
import { updateSchool } from "../../../test/school";

const baseURL = global.baseURL;

const url = `${baseURL}/schools`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).put(url).send({}).expect(401);
});

it("should update a school admin profile", async () => {
  const school = await global.loginSchool();

  let body = {
    school_name: "Boys Collage",
    school_email: "bc@yopmail.com",
    admin_email: "koladefgbc@yopmail.com",
    admin_name: "John Doe",
    password: "54321",
    country: "Nigeria",
  };

  await updateSchool(body, school._id);

  const res = await request(app)
    .put(url)
    .set("x-auth-token", school.token)
    .send({
      school_name: "Queens Collage",
      school_email: "qqueens@yopmail.com",
      admin_email: "jane.qqueens@yopmail.com",
      admin_name: "Jane Doe",
      password: "12345",
      country: "Rome",
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.data._id).toBe(school._id.toString());
  expect(res.body.data).toBeDefined();
});
