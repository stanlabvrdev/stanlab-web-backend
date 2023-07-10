import { StudentScore } from "../../models/studentScore";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import studentTeacherClassService from "../../services/teacherClass/teacher-student-class";
import studentLabExperimentService from "../../services/labExperiment/student-lab-experiment.service";
import { Request, Response } from "express";

async function getLabs(req, res) {
  try {
    const experiments = await studentLabExperimentService.getAll(req);

    ServerResponse(req, res, 200, experiments, "lab successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getClasses(req, res) {
  const studentId = req.student._id;
  try {
    const classes = await studentTeacherClassService.getAll({ student: studentId });
    // const promisified = await Promise.all(results);
    ServerResponse(req, res, 200, classes, "classes successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getTeachers(req, res) {
  try {
    const teachers: any = [];
    const classData = await studentTeacherClassService.getAll({
      class: req.params.classId,
      student: req.student._id,
    });

    for (let data of classData) {
      teachers.push(data.teacher);
    }

    ServerResponse(req, res, 200, teachers, "teachers fetched successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getScores(req: Request, res: Response) {
  const studentId = req.student._id;
  const { classId } = req.params;
  const { isCompleted } = req.query;
  try {
    const conditions: any = { studentId: studentId, classId: classId };
    if (isCompleted == "false") {
      conditions.isCompleted = false;
    }

    if (isCompleted == "true") {
      conditions.isCompleted = true;
    }

    const scores = await StudentScore.find(conditions)
      .populate({ path: "student", select: ["name", "_id", "email"], model: "Student" })
      .populate({ path: "student_class", select: ["title", "subject", "section", "_id"] });

    ServerResponse(req, res, 200, scores, "scores successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default { getLabs, getClasses, getScores, getTeachers };
