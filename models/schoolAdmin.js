const mongoose = require("mongoose");

const jwt = require("jsonwebtoken");
const Joi = require("joi");
const envConfig = require("../config/env");

const env = envConfig.getAll();

const schoolAdminSchema = new mongoose.Schema({
    adminName: { type: String, required: true, minLength: 3, maxlength: 255 },
    schoolName: { type: String, required: true, minLength: 3, maxlength: 255 },
    password: { type: String, required: true, minLength: 5 },
    email: { type: String, required: true, unique: true },
    schoolEmail: { type: String, required: true, unique: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    activities: { type: Array },
    role: { type: String, default: "School" },
});

schoolAdminSchema.methods.addTeacher = function(teacherId) {
    const teachers = this.teachers;
    const isExist = teachers.find((t) => t.toString() === teacherId.toString());
    if (isExist) return this;

    teachers.push(teacherId);
    return this;
};

schoolAdminSchema.methods.addStudent = function(studentId) {
    const students = this.students;
    const isExist = students.find((s) => s.toString() === studentId.toString());
    if (isExist) return this;

    students.push(studentId);
    return this;
};
const SchoolAdmin = mongoose.model("SchoolAdmin", schoolAdminSchema);

module.exports = SchoolAdmin;