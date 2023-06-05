import { PAYMENT_TYPES } from "../enums/payment-types";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../enums/transaction.enum";
import { addDaysToDate } from "../helpers/dateHelper";
import { Payment } from "../models/payment";
import { SchoolAdmin } from "../models/schoolAdmin";
import { SchoolTeacher } from "../models/schoolTeacher";
import { Student } from "../models/student";
import { StudentSubscription } from "../models/student-subscription";
import { Teacher } from "../models/teacher";
import { TeacherClass } from "../models/teacherClass";
import { StudentTeacherClass } from "../models/teacherStudentClass";
import { Transaction } from "../models/transaction";
import { passwordService } from "../services";
import BadRequestError from "../services/exceptions/bad-request";
import paymentService from "../services/payment/payment.service";
import { generateUserName } from "../services/student/generator";
import subscriptionService from "../services/subscription/subscription.service";
import generateRandomString from "../utils/randomStr";
import generator from "generate-password";

function generateHash(password) {
  return;
}

export async function createSchool() {
  const password = await passwordService.hash("12345");
  const school = new SchoolAdmin({
    adminName: "test admin",
    schoolName: "test school",
    password,
    email: "test@school.com",
    schoolEmail: "test@school.com",
    role: "School",
    country: "Nigeria",
  });

  return school.save();
}

export async function updateSchool(body: any, schoolId: string) {
  let {
    admin_name,
    school_name,
    admin_email,
    school_email,
    password,
    country,
  } = body;
  let admin = await SchoolAdmin.findById({ _id: schoolId });

  password = await passwordService.hash(password);

  admin.email = admin_email;
  admin.schoolEmail = school_email;
  admin.adminName = admin_name;
  admin.schoolName = school_name;
  admin.password = password;
  admin.country = country;

  return admin.save();
}

export async function createTeacherSchool(teacherId: string) {
  const school = await createSchool();

  const teacherSchool = new SchoolTeacher({
    school: school._id,
    teacher: teacherId,
    teacherApproved: true,
  });

  return teacherSchool.save();
}

export async function createClass() {
  const school = await createSchool();

  const teacherClass = new TeacherClass({
    title: "test title",
    subject: "test subject",
    school: school._id,
    colour: "test colour",
  });

  return teacherClass.save();
}

export async function createStudent(name: string) {
  let nameParts = name.split(" ");
  let userName = await generateUserName(nameParts[0], nameParts[1]);
  let password = generateRandomString(7);
  const hashedPassword = await passwordService.hash("12345");

  const student = new Student({
    name,
    userName,
    email: userName,
    password: hashedPassword,
    authCode: password,
  });
  return student.save();
}

export async function addStudentToClass(
  schoolId: string,
  classId: string,
  name: string
) {
  const student = await createStudent(name);

  const studentClass = new StudentTeacherClass({
    student: student._id,
    class: classId,
    school: schoolId,
  });
  await studentClass.save();

  const freePlan = await subscriptionService.getFreePlan();

  const studentSubscription = new StudentSubscription({
    school: schoolId,
    student: student._id,
    subscriptionPlanId: freePlan._id,
    endDate: addDaysToDate(freePlan.duration),
    extensionDate: addDaysToDate(freePlan.duration),
    autoRenew: false,
  });
  await studentSubscription.save();
}

export async function createTeacher(body: {
  name: string;
  email: string;
  password: string;
}) {
  const teacher = new Teacher({
    name: body.name,
    email: body.email,
    password: body.password,
  });
  return teacher.save();
}

export async function AdminCreateTeacher(
  body: { name: string; email: string },
  schoolId: string
) {
  let password = generateRandomString(7);
  const hashedPassword = await passwordService.hash(password);

  const teacher = new Teacher({
    name: body.name,
    email: body.email,
    password: hashedPassword,
    schoolTeacher: true,
  });
  await teacher.save();

  const teacherSchool = new SchoolTeacher({
    school: schoolId,
    teacher: teacher._id,
    teacherApproved: true,
  });

  await teacherSchool.save();
}

export async function makePayment(body: any, schoolId: string) {
  body = {
    planId: body.plan,
    studentId: [body.student],
    autoRenew: false,
  };

  const school = await SchoolAdmin.findById({ _id: schoolId });

  const response = await paymentService.PaystackInitializePayment(
    school.email,
    3000,
    "NGN",
    `https://www.google.com/`
  );

  if (!response || response.status !== true) {
    throw new BadRequestError("unable to initialize payment");
  }

  let payment: any = new Payment({
    email: school.email,
    cost: 3000,
    currency: "NGN",
    country: "Nigeria",
    school: schoolId,
    student: body.student,
    subscriptionPlanId: body.plan,
    reference: response.data.reference,
    status: TRANSACTION_STATUS.PENDING,
    autoRenew: body.autoRenew,
    type: PAYMENT_TYPES.PAYSTACK,
  });

  payment.save();

  let transaction: any = new Transaction({
    txnRef: generator.generate({
      length: 15,
      numbers: true,
    }),
    paymentRef: payment.reference,
    cost: payment.cost,
    currency: payment.currency,
    type: TRANSACTION_TYPE.SUBSCRIPTION,
    status: TRANSACTION_STATUS.PENDING,
    email: school.email,
    txnFrom: school._id,
    subscriptionPlanId: body.plan,
  });

  transaction.save();

  return payment;
}

export async function verifyPayment(schoolId: string, reference: string) {
  await SchoolAdmin.findById({ _id: schoolId });
  await Payment.findOne({ school: schoolId, reference });
}
