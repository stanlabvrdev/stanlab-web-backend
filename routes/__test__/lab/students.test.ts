import request from "supertest";
import app from "../../../app";

import { createLab } from "./data";

const baseURL = global.baseURL;

const url = `${baseURL}/system-experiments/lab/teacher-labs/students`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).get(url).send({}).expect(401);
});

it("should return empty array if experiment id is not found", async () => {
  const teacher = await global.loginTeacher();
  const res = await request(app)
    .get(url)
    .query({ experiment_id: "63394c35bbd67e772f43fb5d" })
    .set("x-auth-token", teacher.token);

  expect(res.statusCode).toBe(200);
  expect(res.body.data.length).toBe(0);
});

it("should fetch student experiments", async () => {
  const teacher = await global.loginTeacher();

  await createLab(teacher._id, false);
  const lab: any = await createLab(teacher._id);

  const res = await request(app)
    .get(url)
    .query({
      experiment_id: lab.experiment._id.toString(),
    })
    .set("x-auth-token", teacher.token);

  expect(res.statusCode).toBe(200);
  expect(res.body.data.length).toBe(1);
  expect(res.body.data[0].experiment._id).toBe;
});
