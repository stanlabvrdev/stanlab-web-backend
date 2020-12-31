const mongoose = require('mongoose')
const Joi = require('joi')

const questionSchema = new mongoose.Schema({
    dueDate: { type: Date },
    isDue: { type: Boolean, default: false },
    isSend: { type: Boolean, default: false },
    points: { type: Number, required: true },
    imageUrl: { type: String },
    sendDate: { type: Date, default: Date.now },
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
        ref: 'TeacherClass',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
})

function validateQuestion(question) {
    const schema = Joi.object({
        questionText: Joi.string().required(),
        options: Joi.array().required(),
        points: Joi.number().required(),
        dueDate: Joi.date().required(),
        image: Joi.string(),
    })

    return schema.validate(question)
}

const Question = mongoose.model('Question', questionSchema)

module.exports = { Question, validateQuestion }