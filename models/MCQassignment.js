const mongoose = require('mongoose')


//schema for scores since I plan on scores to be an embedded document within the mcq assignment schema

const score = mongoose.Schema({
    score: Number,
    date: {
        type: Date,
        default: Date.now()
    }
})
const mcqSchema = mongoose.Schema({
    questions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionGroup"
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass"
    },
    startDate: Date,
    dueDate: Date,
    instruction: {
        type: String
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
    },

    submissionDate: Date,
    grade: {
        type: Number, // I ain't sure if this should be a number or a string
    },
    comments: {
        type: String,
    },
    noOfQuestions: Number,
    scores: [score]
})

const mcqModel = mongoose.model("mcqModel", mcqSchema);

module.exports = mcqModel;