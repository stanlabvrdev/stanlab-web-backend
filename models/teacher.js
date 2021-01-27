const mongoose = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

// postedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
const teacherSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeacherClass',
    }, ],
    imageUrl: { type: String },
    name: { type: String, minlength: 5, maxlength: 50, required: true },
    password: { type: String, minlength: 5, maxlength: 1024, required: true },
    questions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
        default: [],
    },
    students: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        status: { type: String, default: '' },
        isAccepted: { type: Boolean, default: false },
        invite: { type: String, default: 'teacher' },
    }, ],
    studentsByEmail: [],
    sentQuizclasswork: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'QuizClasswork' },
    ],
    archivedQuestions: { type: [] },
    role: { type: String, default: 'Teacher' },
    avatar: { type: Buffer },
})

function validateTeacher(teacher) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(5).max(255).required(),
        questions: Joi.array(),
        students: Joi.array(),
    })
    return schema.validate(teacher)
}

function validateUpdateTeacher(teacher) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(50).required(),
        email: Joi.string().email().required(),
    })
    return schema.validate(teacher)
}

teacherSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role },
        config.get('jwtKey'),
    )
    return token
}

teacherSchema.methods.checkStudentById = function(studentId) {
    if (
        this.students.find((s) => s.student.toString() === studentId.toString())
    ) {
        return true
    }
    return false
}
teacherSchema.methods.addStudent = function(studentId, inviteFrom) {
    let student = this.students.find(
        (s) => s.student.toString() === studentId.toString(),
    )

    if (student) {
        return this
    }

    if (inviteFrom)
        student = {
            student: studentId,
            status: '',
            isAccepted: false,
            invite: inviteFrom,
        }
    else
        student = {
            student: studentId,
            status: '',
            isAccepted: false,
            invite: 'teacher',
        }
    this.students.push(student)
    return this
}

teacherSchema.methods.acceptStudent = function(studentId) {
    let student = this.students.find(
        (s) => s.student.toString() === studentId.toString(),
    )

    /**
     * there should be student and
     * the invite is sent by the student to the teacher not the one sent by the teacher to a student
     */
    if (student) {
        student.isAccepted = true
        return this
    }
    return this
}

teacherSchema.methods.deleteClassById = function(classId) {
    let index = this.classes.findIndex((c) => c.toString() === classId.toString())

    if (index < 0) return this
    this.classes.splice(index, 1)
    return this
}

teacherSchema.methods.addSentQuizClasswork = function(quizClassworkId) {
    let scw = this.sentQuizclasswork.find(
        (s) => s.toString() === quizClassworkId.toString(),
    )

    if (scw) {
        return this
    }

    this.sentQuizclasswork.push(quizClassworkId)
    return this
}

teacherSchema.methods.removeStudent = function(studentId) {
    const index = this.students.findIndex(
        (data) => data.student.toString() === studentId.toString(),
    )
    if (index < 0) return null

    this.students.splice(index, 1)
    return this
}

teacherSchema.methods.markStudentAsRemoved = function(studentId) {
    let student = this.students.find(
        (sd) => sd.student.toString() === studentId.toString(),
    )

    if (student) {
        student.status = 'removed'
        return this
    }
    return this
}

teacherSchema.methods.addUnregisterStudent = function(email) {
    if (this.students.length > 0) {
        const student = this.studentsByEmail.find((s) => s === email)
        if (student) return this
    }
    this.studentsByEmail.push(email)
    return this
}
const Teacher = mongoose.model('Teacher', teacherSchema)

module.exports = { Teacher, validateTeacher, validateUpdateTeacher }