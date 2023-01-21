const mongoose = require("mongoose");

const systemExperimentSchema = new mongoose.Schema({
    name: { type: String },
    icon: { type: String },
    objectives: { type: Array },
    class: { type: String },
    demoVideoUrl: { type: String },
    bigQuestion: { type: String },
    testYourKnowlege: { type: String },
    teacherNote: { type: Object },
    subject: { type: String },
    practicalName: { type: String },
});

module.exports = mongoose.model("SystemExperiment", systemExperimentSchema);