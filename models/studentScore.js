const mongoose = require("mongoose");
const Joi = require("joi");

const studentScoreSchema = new mongoose.Schema({
    classId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass",
    },
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "LabExperiment" },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    teacherId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    },
    score: { type: Number },
});

function validateClass(classObj) {
    const schema = Joi.object({
        title: Joi.string().min(5).max(50).required(),
        subject: Joi.string().required(),
        section: Joi.string(),
        classwork: Joi.object(),
    });
    return schema.validate(classObj);
}

const StudentScore = mongoose.model("StudentScore", studentScoreSchema);

module.exports = { StudentScore, validateClass };