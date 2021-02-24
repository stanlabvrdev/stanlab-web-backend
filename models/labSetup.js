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
})

module.exports = mongoose.model('LabSetup', labsetupSchema)