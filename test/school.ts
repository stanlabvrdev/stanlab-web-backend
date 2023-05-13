import { SchoolAdmin } from "../models/schoolAdmin";
import { SchoolTeacher } from "../models/schoolTeacher";
import { passwordService } from "../services";

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

export async function createTeacherSchool(teacherId: string) {
  const school = await createSchool();

  const teacherSchool = new SchoolTeacher({
    school: school._id,
    teacher: teacherId,
    teacherApproved: true,
  });

  return teacherSchool.save();
}
