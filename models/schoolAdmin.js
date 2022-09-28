const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const schoolAdminSchema = new mongoose.Schema({
    adminName: { type: String, required: true, minLength: 3, maxlength: 255 },
    schoolName: { type: String, required: true, minLength: 3, maxlength: 255 },
    password: { type: String, required: true, minLength: 255 },
    email: { type: String, required: true, unique: true },
    schoolEmail: { type: String, required: true, unique: true },
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
    activities: { type: Array },
    role: { type: String, default: "School" },
});

function validateSchoolAdmin(admin) {
    const schema = Joi.object({
        admin_name: Joi.string().min(3).max(255).required(),
        school_name: Joi.string().min(3).max(255).required(),
        admin_email: Joi.string().email().required(),
        school_email: Joi.string().email().required(),
        password: Joi.string().min(5).max(255).required(),
    });

    return schema.validate(admin);
}

function validateSchoolUser(user) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(255).required(),
        email: Joi.string().email().required(),
    });

    return schema.validate(user);
}

schoolAdminSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role }, config.get("jwtKey"));
    return token;
};

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

module.exports = { SchoolAdmin, validateSchoolAdmin, validateSchoolUser };