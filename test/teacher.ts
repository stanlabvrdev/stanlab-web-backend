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
