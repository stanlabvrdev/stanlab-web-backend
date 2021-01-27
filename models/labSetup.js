const mongoose = require('mongoose')

const labsetupSchema = new mongoose.Schema({
    acidName: { type: String },
    experiment: { type: String },
    baseName: { type: String },
    indicatorName: { type: String },
    acidVolume: { type: Number, default: 0 },
    baseVolume: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    subject: { type: String },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    sendDate: { type: Date, default: Date.now },
    dueDate: { type: Date },
})

module.exports = mongoose.model('LabSetup', labsetupSchema)