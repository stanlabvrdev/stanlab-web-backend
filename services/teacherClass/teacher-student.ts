import { StudentTeacher } from "../../models/teacherStudent";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import NotFoundError from "../exceptions/not-found";

class StudentTeacherService {
  async create(teacherId, studentId, classId?) {
    const exist = await StudentTeacher.findOne({ student: studentId, teacher: teacherId });

    if (exist) {
      // approve

      exist.studentApproved = true;

      return exist.save();
    }

    if (classId) {
      const studentClass = new StudentTeacherClass({
        teacher: teacherId,
        student: studentId,
        class: classId,
      });

      await studentClass.save();
    }
    const newStudentTeacher = new StudentTeacher({
      teacher: teacherId,
      student: studentId,
    });

    return newStudentTeacher.save();
  }

  async getAll(conditions) {
    return StudentTeacher.find(conditions).populate("student").populate("teacher");
  }
  async getDownload(conditions) {
    const data = await StudentTeacher.find(conditions)
      .populate({ path: "student", select: "name userName authCode" })
      .populate({ path: "teacher", select: "name email" });

    if (data.length < 1) return data;

    const results: any[] = [];
    for (let item of data) {
      results.push({
        name: item.student.name,
        userName: item.student.userName,
        password: item.student.authCode,
      });
    }

    return results;
  }
  async declineRequest(teacherId, studentId) {
    const exist = await StudentTeacher.findOne({ student: studentId, teacher: teacherId });

    if (!exist) throw new NotFoundError("invite not found");

    // approve

    exist.studentApproved = false;

    return exist.save();
  }

  async getTeachersByStudentId(studentId) {
    const teachers = await StudentTeacher.find({ student: studentId }).populate({
      path: "teacher",
      select: "name email imageUrl avatar _id",
    });

    return teachers;
  }
  async findOne(conditions) {
    return StudentTeacher.findOne(conditions);
  }
  async getTeacherStudents(teacherId) {
    const students = await StudentTeacher.find({ teacher: teacherId }).populate({
      path: "student",
      select: "name email userName imageUrl avatar _id",
    });

    return students;
  }
}
const studentTeacherService = new StudentTeacherService();
export default studentTeacherService;
