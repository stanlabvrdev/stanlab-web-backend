import request from "supertest";
import app from "../../../app";
import { addStudentToClass, createClass, makePayment } from "../../../test/school";
import { createAdmin, createPlan } from "../../../test/super-admin";
import { Student } from "../../../models/student";
import axios from "axios";
import "jest";

const baseURL = global.baseURL;

const url = `${baseURL}/subscriptions`;

let planBody = {
  title: "Standard Plan 2",
  cost: 3000,
  currency: "NGN",
  country: "Nigeria",
  vat: 20,
  description: "This is standard subscription plan for 6 months",
  student_count: 5,
  duration: 183,
  durationType: "months",
  is_active: true,
};

it("should get all subscription plans based on their location", async () => {
  const school = await global.loginSchool();
  let admin = await createAdmin();

  await createPlan(planBody, admin._id);

  const res = await request(app).get(`${url}/get-plans`).set("x-auth-token", school.token);

  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeDefined();
});

it("should pay for student subscription", async () => {
  const school = await global.loginSchool();

  let admin = await createAdmin();

  let plan = await createPlan(planBody, admin._id);

  const teacherClass = await createClass();
  let name = "test student";

  await addStudentToClass(school._id, teacherClass._id, name);

  const student = await Student.find();

  let data = {
    status: true,
    message: "Authorization URL created",
    data: {
      authorization_url: "https://checkout.paystack.com/c8nf5pmkf34pkzw",
      access_code: "c8nf5pmkf34pkzw",
      reference: "kt152fr9hm",
    },
  };

  jest.spyOn(axios, "post").mockResolvedValueOnce({ data });

  const res = await request(app)
    .post(`${url}/make-payment`)
    .set("x-auth-token", school.token)
    .send({
      planId: plan._id,
      studentId: [student[0]._id],
      autoRenew: false,
    });
  console.log(res.body);
  expect(res.statusCode).toBe(200);
  expect(res.body.data).toBeDefined();
  expect(res.body.message).toBe("payment initialized successfully");
});

// it("should verify subscription payment", async () => {
//   const school = await global.loginSchool();

//   let admin = await createAdmin();

//   let plan = await createPlan(planBody, admin._id);

//   const teacherClass = await createClass();
//   let name = "test student";

//   await addStudentToClass(school._id, teacherClass._id, name);

//   const student = await Student.find();

//   let body = {
//     planId: plan._id,
//     studentId: [student[0]._id],
//     autoRenew: false,
//   };

//   const data: any = await makePayment(body, school._id);

//   jest.spyOn(axios, "get").mockResolvedValueOnce(data);

//   const res = await request(app)
//     .post(`${url}/verify-payment`)
//     .set("x-auth-token", school.token)
//     .query({
//       reference: data.reference,
//     })
//     .send({
//       planId: plan._id,
//       studentId: [student[0]._id],
//       autoRenew: false,
//     });
//   console.log(res.body);
//   //This endpoint will always be incomplete because payment is
//   //outside our application and we don't have direct controll over it
//   expect(res.body.message).toBe("The transaction was not completed");
//   expect(res.body.data).toBe(null);
// });
