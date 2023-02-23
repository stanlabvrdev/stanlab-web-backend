//This model is for questions generated through the question gen endpoint
const mongoose = require('mongoose')

const questionSchema = mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: {
        type: [{
            answer: String,
            isCorrect: {
                type: Boolean,
                default: false
            },
        }, ],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})

const GeneratedQuestions = mongoose.model("GeneratedQuestion", questionSchema);

const questionGroupSchema = mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    topic: {
        type: String,
        required: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GeneratedQuestion'
    }]
})

const QuestionGroup = mongoose.model('QuestionGroup', questionGroupSchema)

module.exports = {
    QuestionGroup,
    GeneratedQuestions
}