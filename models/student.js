const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

// profile:snapshot of the student
const studentSchema = new mongoose.Schema({
    name: { type: String, minlength: 5, maxlength: 255, required: true },
    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        required: true,
        unique: true,
    },
    photo: { type: String },
    googleId: { type: String },
    provider: { type: String },
    password: { type: String, minlength: 5, maxlength: 1024, required: true },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass",
    }, ],
    classwork: [{
        classId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
        quizs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    }, ],
    role: { type: String, default: "Student" },
    teachers: [{
        teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
        isAccepted: { type: Boolean, default: false },
    }, ],
    avatar: { type: Buffer },
    questions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
        default: [],
    },
});

studentSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role },
        config.get("jwtKey")
    );
    return token;
};

function validateStudent(student) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required(),
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(5).max(255).required(),
        studentClass: Joi.string(),
        role: Joi.string(),
        teacher: Joi.objectId(),
    });

    return schema.validate(student);
}

function validateIDs(id, testString) {
    return Joi.object({
        [testString]: Joi.objectId(),
    }).validate(id);
}

const Student = mongoose.model("Student", studentSchema);
module.exports = { Student, validateStudent, validateIDs };