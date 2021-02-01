const mongoose = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')

// profile:snapshot of the student
const studentSchema = new mongoose.Schema({
    avatar: { type: Buffer },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeacherClass',
    }, ],
    classworks: {
        quizClasswork: [
            { type: mongoose.Schema.Types.ObjectId, ref: 'QuizClasswork' },
        ],
        labClasswork: [],
    },

    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        required: true,
        unique: true,
    },
    name: { type: String, minlength: 5, maxlength: 255, required: true },
    password: { type: String, minlength: 5, maxlength: 1024, required: true },
    imageUrl: { type: String },
    plan: {
        charge: { type: Number, default: 0 },
        description: String,
        name: { type: String, default: 'basic' },
    },

    role: { type: String, default: 'Student' },

    teachers: [{
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Teacher',
        },
        isAccepted: { type: Boolean },
        status: { type: String },
        invite: { type: String },
    }, ],
    unregisteredTeacher: [{ type: String }],
    questions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
        default: [],
    },
    signupDate: { type: Date, default: Date.now },
    trialPeriodEnds: { type: Date },
})

studentSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role },
        config.get('jwtKey'),
    )
    return token
}

studentSchema.methods.addTeacher = function(teacherId, inviteFrom) {
    let teacher = this.teachers.find(
        (td) => td.teacher.toString() === teacherId.toString(),
    )

    if (teacher) {
        teacher.status = ''
        return this
    }

    if (inviteFrom)
        teacher = { teacher: teacherId, isAccepted: false, invite: inviteFrom }
    else teacher = { teacher: teacherId, isAccepted: false, invite: 'student' }

    this.teachers.push(teacher)
    return this
}

studentSchema.methods.checkTeacherById = function(teacherId) {
    if (
        this.teachers.find((s) => s.teacher.toString() === teacherId.toString())
    ) {
        return true
    }
    return false
}

studentSchema.methods.acceptTeacher = function(teacherId) {
    let teacher = this.teachers.find(
        (td) => td.teacher.toString() === teacherId.toString(),
    )

    if (teacher) {
        teacher.isAccepted = true
        return this
    }
    return this
}

studentSchema.methods.removeTeacher = function(teacherId) {
    const index = this.teachers.findIndex(
        (data) => data.teacher.toString() === teacherId.toString(),
    )
    if (index < 0) return null

    this.teachers.splice(index, 1)
    return this
}

studentSchema.methods.markTeacherAsRemoved = function(teacherId) {
    let teacher = this.teachers.find(
        (td) => td.teacher.toString() === teacherId.toString(),
    )

    if (teacher) {
        teacher.status = 'removed'
        return this
    }
    return this
}

studentSchema.methods.addUnregisterTeacher = function(email) {
    const teacher = this.unregisteredTeacher.find((t) => t === email)
    if (teacher) return null
    this.unregisteredTeacher.push(email)
    return this
}

function validateStudent(student) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required(),
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(5).max(255).required(),
        studentClass: Joi.string(),
        role: Joi.string(),
        teacher: Joi.objectId(),
    })

    return schema.validate(student)
}

function validateIDs(id, testString) {
    return Joi.object({
        [testString]: Joi.objectId(),
    }).validate(id)
}

const Student = mongoose.model('Student', studentSchema)
module.exports = { Student, validateStudent, validateIDs }