const mongoose = require("mongoose");

const Joi = require("joi");

const labExperimentSchema = new mongoose.Schema({
    experiment: { type: mongoose.Schema.Types.ObjectId, ref: "SystemExperiment" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
    dueDate: { type: Date },
    instruction: { type: String },
    startDate: { type: Date, default: Date.now },
});

function validateAssignment(assignnment) {
    const schema = Joi.object({
        due_date: Joi.date().required(),
        start_date: Joi.date(),
        instruction: Joi.string().required(),
        class_id: Joi.string().required(),
    });

    return schema.validate(assignnment);
}

const LabExperiment = mongoose.model("LabExperiment", labExperimentSchema);

module.exports = { LabExperiment, validateAssignment };