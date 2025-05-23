import { Teacher } from "../../models/teacher";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";
import generateRandomString from "../../utils/randomStr";
import { StudentTeacher } from "../../models/teacherStudent";
import Logger from "../../utils/logger";
import { Student } from "../../models/student";

import { SchoolTeacher } from "../../models/schoolTeacher";

import teacherProfileService from "./profile.service";

class TeacherService {
  async findOne(conditions) {
    return Teacher.findOne(conditions);
  }

  async createStudent(data, teacherId) {
    data.authCode = generateRandomString(5);
    const hashedPassword = await passwordService.hash(data.authCode);
    data.password = data.password || hashedPassword;
    data.email = data.email || data.userName;

    const schoolId = await teacherProfileService.getSelectedSchool(teacherId);

    let student = new Student(data);

    student = await student.save();

    const studentTeacher = new StudentTeacher({
      teacher: teacherId,
      student: student._id,
      school: schoolId,
    });

    await studentTeacher.save();

    Logger.info(`created student: ${JSON.stringify(student)}`);
    return student;
  }

  async getOne(conditions) {
    const teacher = await Teacher.findOne(conditions);

    if (!teacher) {
      throw new NotFoundError(`teacher  not found`);
    }
    return teacher;
  }

  async getSchools(teacherId: string) {
    return SchoolTeacher.find({ teacher: teacherId }).populate({
      path: "school",
      select: ["schoolName", "adminName", "schoolEmail", "country", "_id"],
    });
  }
}

export default new TeacherService();
