import mongoose from "mongoose";

const studentTeacherSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  teacherApproved: { type: Boolean, default: true },
  studentApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now() },
});

const StudentTeacher = mongoose.model("StudentTeacher", studentTeacherSchema);

export { StudentTeacher };
