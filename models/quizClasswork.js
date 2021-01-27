const mongoose = require('mongoose')

const quizClassworkSchema = new mongoose.Schema({
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],

    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },

    dueDate: { type: Date, required: true },
    startDate: { type: Date },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherClass' },
})

module.exports = mongoose.model('QuizClasswork', quizClassworkSchema)