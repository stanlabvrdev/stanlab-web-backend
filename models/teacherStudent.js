const mongoose = require("mongoose");

const studentTeacherSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    teacherApproved: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now() },
});

const StudentTeacher = mongoose.model("StudentTeacher", studentTeacherSchema);

module.exports = { StudentTeacher };