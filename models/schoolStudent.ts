import mongoose from "mongoose";

const schoolStudentSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  studentApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now() },
});

const SchoolStudent = mongoose.model("SchoolStudent", schoolStudentSchema);

export { SchoolStudent };
