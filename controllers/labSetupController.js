const config = require("config");
const fetch = require("node-fetch");

const LabSetup = require("../models/labSetup");
const Experiment = require("../models/experiment");
const { TeacherClass } = require("../models/teacherClass");
const { Student } = require("../models/student");

async function postCreateLab(req, res) {
    const { classId } = req.params;

    if (!classId) return res.status(400).send({ message: "Please create class" });
    // let {
    //     acidName,
    //     baseName,
    //     indicatorName,
    //     acidVolume,
    //     baseVolume,
    //     points,
    //     experiment,
    //     subject,
    // } = req.body

    const teacherClass = await TeacherClass.findOne({ _id: classId });

    let labsetup = new LabSetup({...req.body });
    try {
        labsetup.teacher = req.teacher._id;
        labsetup = await labsetup.save();
        teacherClass.classwork.lab.push(labsetup._id);
        await teacherClass.save();
        res.send(labsetup);
    } catch (error) {
        console.log(error.meddage);
        res.status(500).send({ message: "something went wrong" });
    }
}

async function getActiveExperiment(req, res) {
    const { experimentId } = req.params;

    try {
        const experiment = await LabSetup.findOne({ _id: experimentId }).select("-students -teacher -__v");
        const student = await Student.findOne({ _id: req.student._id });

        if (!student) return res.status(403).send({ message: "Access Denied" });

        if (!experiment) return res.status(404).send({ message: "Not Found" });
        res.send(experiment);
    } catch (error) {
        console.log(error);
        res.send({ message: "Something went wrong" });
    }
}

async function getActiveExperiments(req, res) {
    try {
        const _experiments = await Experiment.find({ students: { $in: [req.student._id] } });

        let experimentIds = [];
        _experiments.forEach((data) => {
            experimentIds = experimentIds.concat(data.experiments);
        });

        const experiments = await LabSetup.find({ _id: { $in: experimentIds } })
            .select("-students -__v")
            .populate({ path: "teacher", select: ["name", "_id", "email"] });
        const student = await Student.findOne({ _id: req.student._id });

        if (!student) return res.status(403).send({ message: "Access Denied" });

        if (!experiments) return res.status(404).send({ message: "Not Found" });
        res.send(experiments);
    } catch (error) {
        console.log(error);
        res.send({ message: "Something went wrong" });
    }
}
async function getExperiments(req, res) {
    const { experiments } = req.body;

    if (!experiments || !Array.isArray(experiments))
        return res.status(400).send({ message: "array of experiments is required" });
    try {
        const lab = await LabSetup.find({ _id: { $in: experiments } }).select("-students -teacher -__v");

        res.send(lab);
    } catch (error) {
        console.log(error);
        res.send({ message: "Something went wrong" });
    }
}

async function postLabResult(req, res) {
    const { experimentId, scores, experiment } = req.body;
    if (!experimentId || !scores || !experiment)
        return res.status(400).send({ message: 'Please provide "experimentId" and "scores"' });
    try {
        let student = await Student.findOne({ _id: req.student._id });
        student = student.addCompleteExperiment(experimentId, scores, experiment);
        await student.save();
        res.send(true);
    } catch (error) {
        console.log(error);
        res.send({ message: "Something went wrong" });
    }
}
module.exports = {
    postCreateLab,
    getActiveExperiment,
    postLabResult,
    getExperiments,
    getActiveExperiments,
};