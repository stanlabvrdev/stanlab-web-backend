import request from "supertest";
import app from "../../../app";

import { createClass, createExperiment, createScore } from "./mock";
import { StudentScore } from "../../../models/studentScore";

const baseURL = global.baseURL;

const url = `${baseURL}/v2/grade-book/bulk`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).put(`${url}`).send({}).expect(401);
});

it("should update student grade", async () => {
  const teacher = await global.loginTeacher();
  const student = await global.loginStudent();

  const classData = await createClass(teacher._id, student._id);

  const classId = classData.class_data._id;
  const experiment = await createExperiment(teacher._id, classId, student._id);

  const score = await createScore(teacher._id, student._id, classId, experiment._id);

  const res = await request(app)
    .put(`${url}`)
    .send({
      scores: [{ id: score._id, score: 20 }],
    })
    .set("x-auth-token", teacher.token);

  expect(res.statusCode).toBe(200);
  const updatedScore = await StudentScore.findOne({ _id: score._id });

  expect(updatedScore!.score).toBe(20);
});
