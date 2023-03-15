const mongoose = require('mongoose')

//schema for scores since I plan on scores to be an embedded document within the mcq assignment schema
const score = mongoose.Schema({
    score: Number,
    date: {
        type: Date,
        default: Date.now()
    }
})

//This model holds the teacher's copy of the assignment - will be used for things like tracking student's submission and assignment history of a teacher
const teacherMCQschema = mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
    },
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
    type: {
        type: String,
        enum: ['Practice', 'Test'],
        default: 'Practice'
    },
    status: {
        type: String,
        default: 'Assigned',
        enum: ['Assigned', 'Submitted', 'Expired']
    },
    studentsWork: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "studentMCQ"
    }]
})

//This model is the student's copy of the assignment
const studentMCQSchema = mongoose.Schema({
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
    type: {
        type: String,
        enum: ['Practice', 'Test'],
        default: 'Practice'
    },
    status: {
        type: String,
        default: 'Assigned',
        enum: ['Assigned', 'Submitted', 'Expired']
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
    },
    grade: {
        type: Number, // I ain't sure if this should be a number or a string
    },
    comments: {
        type: String,
    },
    scores: {
        type: [score],
        default: []
    }
})

studentMCQSchema.pre('/^find/', function (next) {
    const currentDate = new Date();
    const isExpired = currentDate > this.dueDate
    const anySubmission = this.scores.length > 0
    currentStatus = this.status
    if (this.type === 'Practice' && isExpired) {
        (anySubmission) ? this.status = 'Submitted': this.status = 'Expired'
    } else if (this.type === 'Test' && isExpired) {
        (this.type === 'Assigned') ? this.status = 'Expired': this.status = currentStatus
    }
    next();
});


const studentMCQ = mongoose.model("studentMCQ", studentMCQSchema);

module.exports = studentMCQ;