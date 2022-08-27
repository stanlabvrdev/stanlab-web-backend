const mongoose = require("mongoose");

const labExperimentSchema = new mongoose.Schema({
    experiment: { type: mongoose.Schema.Types.ObjectId, ref: "LabExperiment" },

    dueDate: { type: Date },
    startDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LabExperiment", labExperimentSchema);