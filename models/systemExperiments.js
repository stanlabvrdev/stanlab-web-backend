const mongoose = require("mongoose");

const systemExperimentSchema = new mongoose.Schema({
    name: { type: String },
    objectives: { type: String },
    demoVideoUrl: { type: String },
    bigQuestion: { type: String },
    testYourKnowlege: { type: String },
    teacherNote: { type: String },
    subject: { type: String },
    practicalName: { type: String },
});

module.exports = mongoose.model("SystemExperiment", systemExperimentSchema);