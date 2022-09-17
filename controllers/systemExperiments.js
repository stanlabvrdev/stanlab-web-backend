const SystemExperiment = require("../models/systemExperiments");

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
module.exports = {
    getSystemExperiments,
    createSystemExperiments,
    getExperiment,
};