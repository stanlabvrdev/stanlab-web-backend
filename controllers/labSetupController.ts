import fetch from "node-fetch";

import LabSetup from "../models/labSetup";
import Experiment from "../models/experiment";
import { TeacherClass } from "../models/teacherClass";
import { Student } from "../models/student";
import { StudentScore } from "../models/studentScore";
import { LabExperiment } from "../models/labAssignment";
import NotFoundError from "../services/exceptions/not-found";
import { ServerResponse, ServerErrorHandler } from "../services/response/serverResponse";
import { submittedScoreNotification } from "../services/student/notification";
import { labAssignmentService } from "../services/lab-assignment/lab.service";

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

  let labsetup = new LabSetup({ ...req.body });
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

    const experiments = await labAssignmentService.getLabs({
      student: req.student._id,
      isCompleted: false,
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
    const experiment = await LabExperiment.findOne({ _id: experimentId, student: studentId });

    if (!experiment) throw new NotFoundError("experiment not found");

    experiment.grade = req.body.score;
    experiment.isCompleted = true;

    await experiment.save();

    await submittedScoreNotification(studentId, experiment._id);
    ServerResponse(req, res, 200, experiment, "scored sent successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
export default { postCreateLab, getActiveExperiment, postLabResult, getExperiments, getActiveExperiments, postScore };
