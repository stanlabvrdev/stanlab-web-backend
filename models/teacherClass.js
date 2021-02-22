const mongoose = require('mongoose')
const Joi = require('joi')

const teacherClassSchema = new mongoose.Schema({
    title: { type: String, minlength: 5, maxlength: 50, required: true },
    subject: { type: String, required: true },
    section: { type: String },
    classwork: {
        lab: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LabSetup',
        }, ],
        quiz: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
        }, ],
    },

    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    }, ],

    studentsByEmail: [],
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    sentQuiz: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizClasswork' }],
    sentLab: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experiment' }],
    isPublished: { type: Boolean, default: false },
})

teacherClassSchema.methods.publishClass = function() {
    this.isPublished = true
    return this
}

teacherClassSchema.methods.addSentQuiz = function(quizClassworkId) {
    let scw = this.sentQuiz.find(
        (s) => s.toString() === quizClassworkId.toString(),
    )

    if (scw) {
        return this
    }

    this.sentQuiz.push(quizClassworkId)
    return this
}
teacherClassSchema.methods.addSentLab = function(experimentId) {
    let scl = this.sentLab.find((l) => l.toString() === experimentId.toString())

    if (scl) {
        return this
    }

    this.sentLab.push(quizClassworkId)
    return this
}

teacherClassSchema.methods.checkStudentById = function(studentId) {
    if (this.students.find((s) => s.toString() === studentId.toString())) {
        return true
    }
    return false
}

teacherClassSchema.methods.addStudentToClass = function(studentId) {
    if (this.students.find((s) => s.toString() === studentId.toString())) {
        return this
    }

    this.students.push(studentId)

    return this
}
teacherClassSchema.methods.removeStudentFromClass = function(studentId) {
    const index = this.students.findIndex(
        (s) => s.toString() === studentId.toString(),
    )
    if (index < 0) {
        return null
    }

    this.students.splice(index, 1)

    return this
}

function validateClass(classObj) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(50).required(),
        subject: Joi.string().required(),
        section: Joi.string(),
        classwork: Joi.object(),
        students: Joi.array(),
    })
    return schema.validate(classObj)
}

const TeacherClass = mongoose.model('TeacherClass', teacherClassSchema)

module.exports = { TeacherClass, validateClass }