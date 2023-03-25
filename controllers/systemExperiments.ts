import SystemExperiment from "../models/systemExperiments";
import NotFoundError from "../services/exceptions/not-found";
import { ServerResponse, ServerErrorHandler } from "../services/response/serverResponse";

async function getSystemExperiments(req, res) {
  try {
    const experiments = await SystemExperiment.find({});

    res.send({ message: "experiments successfully fetched", data: experiments });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getExperiment(req, res) {
  try {
    const experimentId = req.params.experimentId;

    const experiment = await SystemExperiment.findOne({ _id: experimentId });

    if (!experiment) return res.status(404).send({ message: "experiment not found" });
    res.send({ message: "experiment successfully fetched", data: experiment });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function deleteExperiment(req, res) {
  try {
    const experimentId = req.params.experimentId;

    const experiment = await SystemExperiment.deleteOne({ _id: experimentId });

    res.send({ message: "experiment successfully deleted", data: experiment });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function createSystemExperiments(req, res) {
  try {
    const experiment = new SystemExperiment(req.body);

    await experiment.save();

    res.send({ message: "experiments successfully created", data: experiment });
  } catch (error) {
    ServerErrorHandler(req, res, error);
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
export default {
  getSystemExperiments,
  createSystemExperiments,
  getExperiment,
  deleteExperiment,
  updateSystemExperiments,
};
