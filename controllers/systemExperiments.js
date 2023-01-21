const SystemExperiment = require("../models/systemExperiments");
const NotFoundError = require("../services/exceptions/not-found");
const { ServerResponse, ServerErrorHandler } = require("../services/response/serverResponse");

async function getSystemExperiments(req, res) {
    try {
        const experiments = await SystemExperiment.find({});

        res.send({ message: "experiments successfully fetched", data: experiments });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Something went wrong" });
    }
}

async function getExperiment(req, res) {
    try {
        const experimentId = req.params.experimentId;

        const experiment = await SystemExperiment.findOne({ _id: experimentId });

        if (!experiment) return res.status(404).send({ message: "experiment not found" });
        res.send({ message: "experiment successfully fetched", data: experiment });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error.message);
    }
}
async function deleteExperiment(req, res) {
    try {
        const experimentId = req.params.experimentId;

        const experiment = await SystemExperiment.deleteOne({ _id: experimentId });

        res.send({ message: "experiment successfully deleted", data: experiment });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error);
    }
}

async function createSystemExperiments(req, res) {
    try {
        const experiment = new SystemExperiment(req.body);

        await experiment.save();

        res.send({ message: "experiments successfully created", data: experiment });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Something went wrong" });
    }
}

async function updateSystemExperiments(req, res) {
    try {
        const id = req.params.id;
        const { name, objectives, demoVideoUrl, bigQuestion, testYourKnowlege, teacherNote, subject, icon } = req.body;

        const experiment = await SystemExperiment.findOne({ _id: id });
        if (!experiment) throw new NotFoundError("experiment not found");

        if (name) experiment.name = name;
        if (objectives) experiment.objectives = objectives;
        if (demoVideoUrl) experiment.demoVideoUrl = demoVideoUrl;
        if (bigQuestion) experiment.bigQuestion = bigQuestion;
        if (testYourKnowlege) experiment.testYourKnowlege = testYourKnowlege;
        if (teacherNote) experiment.teacherNote = teacherNote;
        if (subject) experiment.subject = subject;
        if (icon) experiment.icon = icon;

        await experiment.save();

        ServerResponse(req, res, 200, experiment, "updated successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
module.exports = {
    getSystemExperiments,
    createSystemExperiments,
    getExperiment,
    deleteExperiment,
    updateSystemExperiments,
};