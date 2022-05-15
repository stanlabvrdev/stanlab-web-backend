const mongoose = require("mongoose");

const labsetupSchema = new mongoose.Schema({
    acidName: { type: String },
    experiment: { type: String },
    baseName: { type: String },
    indicatorName: { type: String },
    acidVolume: { type: Number },
    baseVolume: { type: Number },
    points: { type: Number, default: 0 },
    subject: { type: String },
    isActive: { type: Boolean, default: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
}, { strict: false });

module.exports = mongoose.model("LabSetup", labsetupSchema);