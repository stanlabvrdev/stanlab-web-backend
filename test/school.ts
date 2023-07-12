import { Profile } from "../models/profile";
import { SchoolAdmin } from "../models/schoolAdmin";
import { SchoolTeacher } from "../models/schoolTeacher";
import { Student } from "../models/student";
import { Teacher } from "../models/teacher";
import { TeacherClass } from "../models/teacherClass";
import { StudentTeacherClass } from "../models/teacherStudentClass";
import { passwordService } from "../services";
import { generateUserName } from "../services/student/generator";
import generateRandomString from "../utils/randomStr";

function generateHash(password) {
  return;
}

export async function createSchool() {
  const password = await passwordService.hash("12345");
  const school = new SchoolAdmin({
    adminName: "test admin",
    adminTitle: "mr",
    schoolName: "test school",
    password,
    email: "test@school.com",
    role: "School",
    country: "Nigeria",
  });

  return school.save();
}

export async function updateSchool(body: any, schoolId: string) {
  let { admin_name, school_name, admin_email, admin_title, password, country } =
    body;
  let admin = await SchoolAdmin.findById({ _id: schoolId });

  password = await passwordService.hash(password);

  admin.email = admin_email;
  admin.adminTitle = admin_title;
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

  return student;
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
  teacher.save();

  return teacher;
}
