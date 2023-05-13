import express from "express";

const router = express.Router();

import { teacherAuth, studentAuth } from "../middleware/auth";
import labExperimentController from "../controllers/labExperimentController";
import studentTrialPeriodChecker from "../middleware/studentTrialPeriodChecker";

router.post("/:experimentId/assign", teacherAuth, labExperimentController.assignLab);
// router.get("/student-labs", [studentAuth, studentTrialPeriodChecker], labExperimentController.getStudentLabs);
router.get("/student-labs", [studentAuth], labExperimentController.getStudentLabs);

router.get("/teacher-labs", [teacherAuth], labExperimentController.getTeacherAssignedLabs);
router.delete("/teacher-labs", labExperimentController.deleteAssignedLabsByTeacher);

router.get("/teacher-labs/students", [teacherAuth], labExperimentController.getLabStudents);

export default router;
