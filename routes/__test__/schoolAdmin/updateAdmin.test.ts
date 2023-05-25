import request from "supertest";
import app from "../../../app";
import { addStudentToClass, createClass } from "../../../test/school";
import { SchoolStudent } from "../../../models/schoolStudent";
import { StudentSubscription } from "../../../models/student-subscription";

const baseURL = global.baseURL;

const url = `${baseURL}/schools`;
it("can only be accessed if admin is signed in", async () => {
  await request(app).put(url).send({}).expect(401);
});