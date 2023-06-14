import express from "express";

// import  { studentPassport } from '../services/initPassport
// import  passportAuth from '../middleware/studentPassportAuth
import { studentAuth } from "../../middleware/auth";
import paymentAuth from "../../middleware/paymentAuth";
import { isFreelanceStudent } from "../../middleware/isFreelance";
import studentsController from "../../controllers/V2/studentController";
import { studentMCQController } from "../../controllers/V2/studentMCQ.controller";

const router = express.Router();
router.get("/labs", studentAuth, studentsController.getLabs);
router.get("/classes", studentAuth, studentsController.getClasses);
router.get("/classes/:classId/teachers", studentAuth, studentsController.getTeachers);
router.get("/classes/:classId/scores", studentAuth, studentsController.getScores);
router.get("/mcq-assignments", studentAuth, studentMCQController.getAssignments);
router.route("/mcq-assignments/:id").get(studentAuth, studentMCQController.getAssignment).post(studentAuth, studentMCQController.makeSubmission);
router.get("/mcq-assignments/:id/scores", studentAuth, studentMCQController.getAssignmentScoresByClass);
export default router;
