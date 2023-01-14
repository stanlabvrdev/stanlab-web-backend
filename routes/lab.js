const express = require("express");

const router = express.Router();

const { teacherAuth, studentAuth } = require("../middleware/auth");
const labExperimentController = require("../controllers/labExperimentController");
const studentTrialPeriodChecker = require("../middleware/studentTrialPeriodChecker");

router.post("/:experimentId/assign", teacherAuth, labExperimentController.assignLab);
// router.get("/student-labs", [studentAuth, studentTrialPeriodChecker], labExperimentController.getStudentLabs);
router.get("/student-labs", [studentAuth], labExperimentController.getStudentLabs);
router.get("/teacher-labs", [teacherAuth], labExperimentController.getTeacherAssignedLabs);

module.exports = router;