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
        enum: ['Assigned', 'Expired']
    },
    studentsWork: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "studentMCQ"
    }]
})

//This pre query hook updates the status of the document 
//Update is done based on certain conditions such as - type of assignment, status of assignment and the obvious one duedate vs current date
teacherMCQschema.pre('/^find/', function (next) {
    const currentDate = new Date();
    if (currentDate > this.dueDate && this.status === 'Assigned') {
        this.status = 'Expired'
    }
    next();
});

const teacherMCQ = mongoose.model("teacherMCQ", teacherMCQschema);

module.exports = teacherMCQ