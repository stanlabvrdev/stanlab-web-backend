const express = require("express");

// const { studentPassport } = require('../services/initPassport')
// const passportAuth = require('../middleware/studentPassportAuth')
const {
    studentAuth
} = require("../../middleware/auth");
const paymentAuth = require("../../middleware/paymentAuth");
const {
    isFreelanceStudent
} = require("../../middleware/isFreelance");
const studentsController = require("../../controllers/V2/studentController");
const {
    getAssignments,
    getAssignment,
    makeSubmission
} = require('../../controllers/V2/studentMCQ.controller')


const router = express.Router();

router.get("/labs", studentAuth, studentsController.getLabs);
router.get("/classes", studentAuth, studentsController.getClasses);
router.get("/classes/:classId/teachers", studentAuth, studentsController.getTeachers);
router.get("/classes/:classId/scores", studentAuth, studentsController.getScores);
router.get("/mcq-assignments", studentAuth, getAssignments);
router.route("/mcq-assignments/:id").get(studentAuth, getAssignment).post(studentAuth, makeSubmission)

module.exports = router;