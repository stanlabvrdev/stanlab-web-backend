const mongoose = require('mongoose')
const Joi = require('joi')

const studentClassSchema = new mongoose.Schema({
    title: { type: String, minlength: 5, maxlength: 50, required: true },
    subject: { type: String, required: true },
    section: { type: String },
    classwork: {
        lab: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabSetup' }],
        quiz: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
        }, ],
    },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
    },
})

function validateClass(classObj) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(50).required(),
        subject: Joi.string().required(),
        section: Joi.string(),
        classwork: Joi.object(),
    })
    return schema.validate(classObj)
}

const TeacherClass = mongoose.model('StudentClass', studentClassSchema)

module.exports = { TeacherClass, validateClass }