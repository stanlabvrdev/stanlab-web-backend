//This model is for questions generated through the question gen endpoint

const mongoose = require('mongoose')

const questionSchema = mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    question: {
        type: String,
        required: true
    },
    options: {
        type: [{
            text: String,
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
    },
    is_archived: Boolean,
    subject: { //The plan is that this field should serve as a classifier of some sorts
        type: String,
        required: true,
    }
})

const Question = mongoose.model("Questions", questionSchema);