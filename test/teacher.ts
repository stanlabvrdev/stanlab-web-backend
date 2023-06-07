import { TeacherClass } from "../models/teacherClass";
import { StudentTeacherClass } from "../models/teacherStudentClass";
import { createStudent, createTeacher } from "./school";

export async function createClass(teacherId: string) {
  const teacherClass = new TeacherClass({
    title: "test title",
    subject: "test subject",
    section: "test section",
    teacher: teacherId,
  });

  return teacherClass.save();
}

export async function addStudentToClass(classId: string, name: string) {
  const student = await createStudent(name);

  const studentClass = new StudentTeacherClass({
    student: student._id,
    class: classId,
  });
  await studentClass.save();
}
