import { Teacher } from "../models/teacher";
import { TeacherClass } from "../models/teacherClass";
import { createTeacher } from "./school";

export async function createClass(teacherId) {
  const teacherClass = new TeacherClass({
    title: "test title",
    subject: "test subject",
    section: "test section",
    teacher: teacherId,
  });

  return teacherClass.save();
}
