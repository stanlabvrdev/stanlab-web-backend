import { Filter, LabExperiment, validateAssignment, validateGetQuery } from "../models/labAssignment";

import { ServerResponse, ServerErrorHandler } from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";

import { labAssignmentService } from "../services/lab-assignment/lab.service";
import NotFoundError from "../services/exceptions/not-found";
import { Teacher } from "../models/teacher";
import { StudentScore } from "../models/studentScore";

async function assignLab(req, res) {
  try {
    let { class_id, instruction, start_date, due_date } = req.body;

    const { error } = validateAssignment(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    await labAssignmentService.assign({
      class_id,
      due_date,
      experiment_id: req.params.experimentId,
      instruction,
      start_date,
      teacher_id: req.teacher._id,
    });

    ServerResponse(req, res, 201, null, "experiment successfully assigned");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getStudentLabs(req, res) {
  try {
    const labs = await labAssignmentService.getLabs({ student: req.student._id });

    ServerResponse(req, res, 200, labs, "experiment successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function deleteAssignedLabsByTeacher(req, res) {
  try {
    const teacher = await Teacher.findOne({ email: req.body.email });

    if (!teacher) throw new NotFoundError("teacher not found");

    const result = await LabExperiment.deleteMany({ teacher: teacher._id });
    const result2 = await StudentScore.deleteMany({ teacherId: teacher._id });

    ServerResponse(req, res, 200, { result, result2 }, "successfully deleted!");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getTeacherAssignedLabs(req, res) {
  try {
    const { error } = validateGetQuery(req.query);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const filter: Filter = {
      teacher: req.teacher._id,
    };

    const is_completed = req.query.is_completed;

    if (is_completed) {
      filter.isCompleted = is_completed == "true" ? true : false;
    }

    const labs = await labAssignmentService.getLabs(filter);

    ServerResponse(req, res, 200, labs, "labs successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function getLabStudents(req, res) {
  try {
    const { experiment_id } = req.query;
    const filter: Filter = {
      teacher: req.teacher._id,
    };

    if (experiment_id) {
      filter["experiment._id"] = experiment_id;
    }

    const labs = await labAssignmentService.getLabs(filter);

    ServerResponse(req, res, 200, labs, "students successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default { assignLab, getStudentLabs, getTeacherAssignedLabs, getLabStudents, deleteAssignedLabsByTeacher };
