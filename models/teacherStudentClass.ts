import mongoose from "mongoose";

const studentTeacherClassSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
  school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  createdAt: { type: Date, default: Date.now() },
});

const StudentTeacherClass = mongoose.model("StudentTeacherClass", studentTeacherClassSchema);

export { StudentTeacherClass };
