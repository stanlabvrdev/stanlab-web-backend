const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

// postedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
const teacherSchema = new mongoose.Schema({
    name: { type: String, minlength: 5, maxlength: 50, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, minlength: 5, maxlength: 1024, required: true },
    questions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
        default: [],
    },
    photo: { type: String },
    googleId: { type: String },
    provider: { type: String },
    students: [{
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
        status: { type: String, default: "" },
        isAccepted: { type: Boolean, default: false },
    }, ],
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass",
    }, ],
    archivedQuestions: { type: [] },
    role: { type: String, default: "Teacher" },
    avatar: { type: Buffer },
});

function validateTeacher(teacher) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(5).max(255).required(),
        questions: Joi.array(),
        students: Joi.array(),
    });
    return schema.validate(teacher);
}

function validateUpdateTeacher(teacher) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().email().required(),
    });
    return schema.validate(teacher);
}

teacherSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role },
        config.get("jwtKey")
    );
    return token;
};

const Teacher = mongoose.model("Teacher", teacherSchema);

module.exports = { Teacher, validateTeacher, validateUpdateTeacher };