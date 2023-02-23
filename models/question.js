const mongoose = require("mongoose");
const Joi = require("joi");

const questionSchema = new mongoose.Schema({
    created: { type: String, default: Date.now },
    points: { type: Number, required: true },
    imageUrl: { type: String },
    questionText: { type: String, required: true },
    options: {
        type: [{
            label: String,
            text: String,
            isCorrect: { type: Boolean, default: false },
        }, ],
        required: true,
    },
    teacherClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass",
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
    },
    subject: { type: String },
});

function validateQuestion(question) {
    const schema = Joi.object({
        questionText: Joi.string().required(),
        options: Joi.array().required(),
        points: Joi.number().required(),
        // dueDate: Joi.date().required(),
        image: Joi.string(),
    });

    return schema.validate(question);
}

const Question = mongoose.model("Question", questionSchema);

module.exports = { Question, validateQuestion };