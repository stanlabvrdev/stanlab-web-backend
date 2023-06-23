import express from "express";
import multer from "multer";
const router = express.Router();

import teachersClassControllerV2 from "../../controllers/V2/teacherClassController";

import { teacherAuth } from "../../middleware/auth";
import teachersController from "../../controllers/V2/teacherController";

import { teacherMCQController } from "../../controllers/V2/teacherMCQ.controller";
import { techerProfileMiddleware } from "../../middleware/profile";

// create a teacher
router.post("/", teachersController.createTeacher);

// get teacher students

router.get("/students", techerProfileMiddleware.build(), teachersController.getStudents);

router.get("/students/score", techerProfileMiddleware.build(), teachersController.getStudentScores);

// delete only teacher student
/**
 * THIS DOES NOT DELETE CLASS STUDENT -> because no reference to a specific class is goning to be given
 * CHANGES THE STATUS OF STUDENT -> TEACHER = REMOVED
 *
 */
router.delete("/students/:studentId", teacherAuth, teachersController.deleteStudent);

// teacher create class
/*
body => title, subject, section
*/
router.post("/create-class", teacherAuth, teachersController.createClass);

// get teacher classes

router.get("/classes", techerProfileMiddleware.build(), teachersController.getClass);

// post: Teacher avatar

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload valid image"));
    }
    cb(null, true);
  },
});
// get published quiz

router.post("/avatar", teacherAuth, upload.single("avatar"), teachersController.createAvatar, (error, req, res, next) => {
  res.status(400).send({
    error: error.message,
  });
});

// get teacher avatar
router.get("/:id/avatar", teachersController.getAvatar);

// update a teacher via email and name
router.put("/", teacherAuth, teachersController.updateTeacher);

// teacher add student to class
// by passing the studentId to the body of the request
router.post("/add-student/:classId", teacherAuth, teachersClassControllerV2.addStudentToClass);

// Send questions to all students
/**
 * array of valid students ids is required
 * array of question is required
 * classId
 * Due date
 */
router.post("/send-quiz/:classId", teacherAuth, teachersController.sendQuizToStudents);

router.post("/send-lab/:classId", teacherAuth, teachersController.sendLabToStudents);

/*
 */

// Teacher Invite student to join class using the student  email
// the request body should contain the email of a student

router.post("/invite-student", teacherAuth, teachersController.sendInviteToStudent);

// teacher accept student invitation
router.post("/accept-invite/:studentId", teacherAuth, teachersController.acceptStudentInvite);
router.get("/mcq-assignments/assigned", teacherAuth, teacherMCQController.getAssignmentsAssigned);
router.get("/mcq-assignments/completed", teacherAuth, teacherMCQController.getAssignmentsCompleted);
router.get("/mcq-assignments/uncompleted", teacherAuth, teacherMCQController.getAssignmentsUncompleted);
// get a teacher

router.get("/:id", teachersController.getTeacher);
// Get: all students

router.route("/mcq-assignments/:id").put(teacherAuth, teacherMCQController.editAssignment).delete(teacherAuth, teacherMCQController.deleteAssignment).get(teacherAuth, teacherMCQController.getAssignment);

export default router;
