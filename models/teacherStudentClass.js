const mongoose = require("mongoose");

const studentTeacherClassSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
    createdAt: { type: Date, default: Date.now() },
});

const StudentTeacherClass = mongoose.model("StudentTeacherClass", studentTeacherClassSchema);

module.exports = { StudentTeacherClass };