import { TeacherClass } from "../models/teacherClass";

export async function createClass(teacherId: string, school?: string) {
  const teacherClass = new TeacherClass({
    title: "test title",
    subject: "test subject",
    section: "test section",
    teacher: teacherId,
    school,
  });

  return teacherClass.save();
}
