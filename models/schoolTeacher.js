const mongoose = require("mongoose");

const schoolTeacherSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  teacherApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now() },
});

const SchoolTeacher = mongoose.model("SchoolTeacher", schoolTeacherSchema);

module.exports = { SchoolTeacher };
