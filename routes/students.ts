import express from "express";

// import  { studentPassport } from '../services/initPassport
// import  passportAuth from '../middleware/studentPassportAuth
import { studentAuth } from "../middleware/auth";
import paymentAuth from "../middleware/paymentAuth";
import { isFreelanceStudent } from "../middleware/isFreelance";
import studentsController from "../controllers/studentsController";
import studentTrialPeriodChecker from "../middleware/studentTrialPeriodChecker";
import { createFileFilter, uploadFile } from "../middleware/fileUpload";

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

const fileFilter = createFileFilter();

router.post("/", studentsController.createStudent);
router.post("/bulk", uploadFile("student-file", fileFilter), studentsController.bulkCreate);
router.post("/sign-up/bulk", uploadFile("student-file", fileFilter), studentsController.bulkSignup);
router.post("/sign-up/bulk/download", studentsController.downloadStudents);
router.post("/password/reset", studentsController.createStudent);

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

export default router;
