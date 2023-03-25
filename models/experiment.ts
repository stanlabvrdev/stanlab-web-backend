import mongoose from "mongoose";

const experimentSchema = new mongoose.Schema({
  experiments: [{ type: mongoose.Schema.Types.ObjectId, ref: "LabSetup" }],
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  dueDate: { type: Date },
  startDate: { type: Date, default: Date.now },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
});

export default mongoose.model("Experiment", experimentSchema);
