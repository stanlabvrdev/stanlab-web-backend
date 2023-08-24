import request from "supertest";
import app from "../../../app";
import "jest";
import { describe, it, expect } from "@jest/globals";
import { validData, invalidData } from "./time-table.data";

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
        .put(endPoint)
        .set("x-auth-token", school.token)
        .send(validData);

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("data");
    });
  });
});
