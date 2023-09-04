import request from "supertest";
import app from "../../../app";
import "jest";
import { describe, it, expect } from "@jest/globals";
import { validData, invalidData, saveTimetableFake, createTimetableFake } from "./time-table.data";
import { createClass } from "../../../test/teacher";

const baseURL = global.baseURL;
const endPoint = `${baseURL}/v2/time-table/`;

describe("Timetable endpoints", () => {
  it("can only be accessed if admin is signed in", async () => {
    await request(app).post(endPoint).send({}).expect(401);
  });
  describe("POST /v2/time-table - Generate TIMETABLE", () => {
    it("should throw an error for invalid timetable details details", async () => {
      const school = await global.loginSchool();

      const res = await request(app)
        .post(endPoint)
        .set("x-auth-token", school.token)
        .send(invalidData);

      expect(res.statusCode).toBe(400);
    });
    it("should generate a timetable with valid details", async () => {
      const school = await global.loginSchool();
      const res = await request(app)
        .post(`${endPoint}/generate`)
        .set("x-auth-token", school.token)
        .send(validData);
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("data");
    });
  });

  //Add more situation specific tests - data validation etcetera
  //Transaction issues
  // it("should save a timetable with valid details and permissions", async () => {
  //   const school = await global.loginSchool();
  //   const res = await request(app)
  //     .post(endPoint)
  //     .set("x-auth-token", school.token)
  //     .send(saveTimetableFake);
  //   console.log(res.body);
  //   expect(res.statusCode).toBe(201);
  //   expect(res.body.data).toHaveProperty("data");
  // });

  it("should get a timetable with valid permissions", async () => {
    const school = await global.loginSchool();
    const { timetable } = await createTimetableFake(school._id);
    const res = await request(app)
      .get(`${endPoint}/${timetable._id}`)
      .set("x-auth-token", school.token);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("periods");
  });

  it("should get all timetables with valid permissions", async () => {
    const school = await global.loginSchool();

    await createTimetableFake(school._id);
    await createTimetableFake(school._id);
    const res = await request(app).get(endPoint).set("x-auth-token", school.token);
    expect(res.statusCode).toBe(200);
    expect(res.body.data[0]).toHaveProperty("periods");
  });

  it("should modify a timetable's metadata with valid permissions", async () => {
    const school = await global.loginSchool();
    const { timetable } = await createTimetableFake(school._id);
    const teacher = await global.loginTeacher();
    const teacherClass = await createClass(teacher._id, school._id);
    const res = await request(app)
      .put(`${endPoint}/${timetable._id}`)
      .set("x-auth-token", school.token)
      .send({
        timeTableName: "New Name",
        class: teacherClass._id,
        className: "New Class",
        collaborators: ["64f5b75925b92b109c3aaed9"],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data).not.toBe(null);
  });
});

//Transaction issues
// it("should delete a timetable with valid permissions", async () => {
//   const school = await global.loginSchool();
//   const { timetable } = await createTimetableFake(school._id);
//   const res = await request(app)
//     .delete(`${endPoint}/${timetable._id}`)
//     .set("x-auth-token", school.token);
//   expect(res.statusCode).toBe(204);
// });
