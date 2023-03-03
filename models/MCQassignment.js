const mongoose = require('mongoose')

const mcqSchema = mongoose.Schema({
    questions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionGroup"
    },
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass"
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
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

    submissionDate: {
        type: Date,
    },

    grade: {
        type: Number,
    },
    comments: {
        type: String,
    },
    score: {
        type: Number,
        default: 0
    }
})

const mcqModel = mongoose.model("mcqModel", mcqSchema);

module.exports = mcqModel;