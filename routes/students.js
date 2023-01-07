const express = require("express");

// const { studentPassport } = require('../services/initPassport')
// const passportAuth = require('../middleware/studentPassportAuth')
const { studentAuth } = require("../middleware/auth");
const paymentAuth = require("../middleware/paymentAuth.");
const { isFreelanceStudent } = require("../middleware/isFreelance");
const studentsController = require("../controllers/studentsController");
const studentTrialPeriodChecker = require("../middleware/studentTrialPeriodChecker");

const router = express.Router();

// login via google oauth

// router.get(
//     '/auth/google',
//     studentPassport.authenticate('google', { scope: ['profile', 'email'] }),
// )
// router.get('/auth/google/callback', passportAuth)

// Student send invitation to teacher
/*
post: 
*/
// student should be able to invite many teachers if => in trial period or paid version.
router.post("/invite-teacher", [studentAuth, isFreelanceStudent, paymentAuth], studentsController.inviteTeacher);

// Post: Register a new Student

router.post("/", studentsController.createStudent);

// get login  student

// student accept teacher Invite

/**
 * functionalities and edge cases to implement
 *
 * => student should be able to add only one teacher, if not upgraded
 */

router.post("/accept-invite/:teacherId", studentAuth, studentsController.acceptTeacher);

// delete only teacher
router.delete("/teachers/:teacherId", studentAuth, studentsController.deleteTeacher);

// student decline teacher request
router.post("/decline-invite/:teacherId", studentAuth, studentsController.declineInvite);

// get student classwork
router.get("/classworks", studentAuth, studentsController.getClasswork);
router.get("/classwork/lab", studentAuth, studentsController.getLabClasswork);

// send completed quiz
router.post("/classwork/completed-quiz", studentAuth, studentsController.postFinishedQuiz);
// get completed quiz
router.get("/classwork/completed-quiz/:quizId", studentAuth, studentsController.getFinishedQuiz);

// get student teachers

router.get("/teachers", studentAuth, studentsController.getTeachers);

// get student avatar
router.get("/:id/avatar", studentsController.getAvatar);

// get a student
// router.get(
//     '/:studentId', [studentAuth, studentTrialPeriodChecker],
//     studentsController.getStudent,
// )
router.get("/:studentId", [studentAuth], studentsController.getStudent);

module.exports = router;