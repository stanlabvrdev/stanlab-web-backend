const mongoose = require("mongoose");
const Joi = require("joi");

const teacherClassSchema = new mongoose.Schema({
    title: { type: String, minlength: 5, maxlength: 50, required: true },
    subject: { type: String, required: true },
    section: { type: String },
    classwork: {
        lab: [],
        quiz: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
        }, ],
    },
    students: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
        default: [],
    },
});

function validateClass(classObj) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(50).required(),
        subject: Joi.string().required(),
        section: Joi.string(),
        classwork: Joi.object(),
        students: Joi.array(),
    });
    return schema.validate(classObj);
}

const TeacherClass = mongoose.model("TeacherClass", teacherClassSchema);

module.exports = { TeacherClass, validateClass };