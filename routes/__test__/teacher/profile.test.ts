import request from "supertest";
import app from "../../../app";
import { createTeacherSchool } from "../../../test/school";
import { Profile } from "../../../models/profile";

const baseURL = global.baseURL;

const url = `${baseURL}/teachers/profile`;
it("can only be accessed if teacher is signed in", async () => {
  await request(app).patch(url).send({}).expect(401);
});

it("should return 404 if school id is not found", async () => {
  const teacher = global.loginTeacher();
  await request(app)
    .patch(url)
    .set("x-auth-token", teacher.token)
    .send({
      school_id: "645fb0cead0287969dae3f11",
    })
    .expect(404);
});

it("should update the currently selected school", async () => {
  const teacher = global.loginTeacher();
  const schoolTeacher: any = await createTeacherSchool(teacher._id);

  const res = await request(app).patch(url).set("x-auth-token", teacher.token).send({
    school_id: schoolTeacher.school,
  });

  const updatedProfile = await Profile.findOne({ teacher: teacher._id });

  expect(res.statusCode).toBe(200);
  expect(updatedProfile).toBeDefined();
  expect(updatedProfile.selectedSchool).toBe(schoolTeacher.school);
});
