const config = require("config");
const fetch = require("node-fetch");

const LabSetup = require("../models/labSetup");
const Experiment = require("../models/experiment");
const { TeacherClass } = require("../models/teacherClass");
const { Student } = require("../models/student");
const { StudentScore } = require("../models/studentScore");
const { LabExperiment } = require("../models/labAssignment");
const NotFoundError = require("../services/exceptions/not-found");
const { ServerResponse, ServerErrorHandler } = require("../services/response/serverResponse");
const { submittedScoreNotification } = require("../services/student/notification");

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
        ServerErrorHandler(req, res, error);
    }
}

async function getActiveExperiments(req, res) {
    try {
        const _experiments = await Experiment.find({ students: { $in: [req.student._id] } });

        let experimentIds = [];
        _experiments.forEach((data) => {
            experimentIds = experimentIds.concat(data.experiments);
        });

        // const experiments = await LabSetup.find({ _id: { $in: experimentIds } })
        //     .select("-students -__v")
        //     .populate({ path: "teacher", select: ["name", "_id", "email"] });
        const experiments = await LabExperiment.find({ student: req.student._id, isCompleted: false }).populate({
            path: "experiment",
            select: ["name", "_id", "subject"],
        });

        res.send(experiments);
    } catch (error) {
        ServerErrorHandler(req, res, error);
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
        ServerErrorHandler(req, res, error);
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
        ServerErrorHandler(req, res, error);
    }
}

async function postScore(req, res) {
    const studentId = req.student._id;
    const experimentId = req.body.experimentId;
    try {
        const experiment = await LabExperiment.findOne({ experiment: experimentId, student: studentId });

        if (!experiment) throw new NotFoundError("experiment not found");

        experiment.grade = req.body.score;

        await experiment.save();

        await submittedScoreNotification(studentId, experiment._id);
        ServerResponse(req, res, 200, true, "scored sent successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
module.exports = {
    postCreateLab,
    getActiveExperiment,
    postLabResult,
    getExperiments,
    getActiveExperiments,
    postScore,
};