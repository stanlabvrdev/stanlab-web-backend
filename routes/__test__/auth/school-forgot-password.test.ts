import request from "supertest";
import app from "../../../app";
import { createSchool } from "../../../test/school";
import { resetPassword } from "../../../test/auth";

const baseURL = global.baseURL;

const url = `${baseURL}/auth/admins/reset-password`;

it("should request reset of school admin password", async () => {
  const school = await createSchool();
  await resetPassword("admin", school);

  const res = await request(app).post(url).send({
    email: school.email,
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("reset password link sent successfully");
});

it("should confirm new school admin password", async () => {
  const school = await createSchool();
  const emailToken: any = await resetPassword("admin", school);

  const res = await request(app).post(`${url}/confirm`).send({
    token: emailToken.token,
    new_password: "54321",
  });

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("password  reset  successfully");
});
