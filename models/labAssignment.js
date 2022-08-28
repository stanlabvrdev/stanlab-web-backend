const mongoose = require("mongoose");

const Joi = require("joi");

const labExperimentSchema = new mongoose.Schema({
    experiment: { type: mongoose.Schema.Types.ObjectId, ref: "SystemExperiment" },

    dueDate: { type: Date },
    startDate: { type: Date, default: Date.now },
});

function validateAssignment(assignnment) {
    const schema = Joi.object({
        dueDate: Joi.date().required(),
        startDate: Joi.date(),
    });

    return schema.validate(assignnment);
}

const LabExperiment = mongoose.model("LabExperiment", labExperimentSchema);

module.exports = { LabExperiment, validateAssignment };