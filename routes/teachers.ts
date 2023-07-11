import express from "express";
import multer from "multer";
const router = express.Router();
import {
  uploadFile,
  createFileFilter,
  diskStorage,
} from "../middleware/fileUpload";

const fileFilter = createFileFilter();
const diskUpload = diskStorage();
// import  passport from "passport"

// import  { teacherPassport } from '../services/initPassport
// import  passportAuth from '../middleware/teacherPassportAuth

import { teacherAuth } from "../middleware/auth";
import teachersController from "../controllers/teachersController";
import schoolClassController from "../controllers/schoolClassController";

import teachersClassControllerV2 from "../controllers/V2/teacherClassController";
import { techerProfileMiddleware } from "../middleware/profile";
// const info;
// login via google oauth

// router.get(
//     '/auth/google',
//     teacherPassport.authenticate('google', { scope: ['profile', 'email'] }),
// )
// router.get('/auth/google/callback', passportAuth)

// create a teacher
router.post("/", teachersController.createTeacher);

// get teacher students

router.get("/schools", teacherAuth, teachersController.getSchools);
router.get(
  "/students",
  techerProfileMiddleware.build(),
  teacherAuth,
  teachersController.getStudents
);
router.patch("/profile", teacherAuth, teachersController.updateProfile);

// delete only teacher student
/**
 * THIS DOES NOT DELETE CLASS STUDENT -> because no reference to a specific class is goning to be given
 * CHANGES THE STATUS OF STUDENT -> TEACHER = REMOVED
 *
 */
router.delete(
  "/students/:studentId",
  teacherAuth,
  teachersController.deleteStudent
);

// teacher create class
/*
body => title, subject, section
*/
router.post("/create-class", teacherAuth, teachersController.createClass);

// create class as a sub admin
router.post(
  "/schools/classes",
  teacherAuth,
  schoolClassController.create
);
// get school classes as a sub admin
router.get(
  "/schools/classes",
  teacherAuth,
  schoolClassController.getList
);
// get a school class as a sub admin
router.get(
  "/schools/classes/:id",
  teacherAuth,
  schoolClassController.getById
);
// update a school class as a sub admin
router.put(
  "/schools/classes/:id",
  teacherAuth,
  schoolClassController.update
);
// add students to class as a sub admin
router.put(
  "/schools/classes/:classId/students",
  teacherAuth,
  schoolClassController.addStudent
);
// get school students as a sub admin
router.get(
  "/schools/class/students",
  teacherAuth,
  schoolClassController.getStudents
);
// create school teacher
router.post(
  "/schools/classes/teacher",
  teacherAuth,
  schoolClassController.addTeacher
);
// get school teachers as a sub admin
router.get(
  "/schools/class/teachers",
  teacherAuth,
  schoolClassController.getTeachers
);
// remove school student
router.delete(
  "/schools/classes/student",
  teacherAuth,
  schoolClassController.removeStudent
);

// remove school teacher
router.delete(
  "/schools/classes/teacher",
  teacherAuth,
  schoolClassController.removeTeacher
);

// get teacher classes

router.get(
  "/classes",
  techerProfileMiddleware.build(),
  teacherAuth,
  teachersController.getClass
);

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

router.post(
  "/avatar",
  teacherAuth,
  upload.single("avatar"),
  teachersController.createAvatar,
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// add students to class in bulk as a sub admin
router.put(
  "/schools/classes/bulk/:classId/students",
  teacherAuth,
  uploadFile("student-file", fileFilter, diskUpload),
  schoolClassController.addBulkStudents
);

router.post(
  "/schools/classes/bulk/teacher",
  teacherAuth,
  uploadFile("teacher-file", fileFilter, diskUpload),
  schoolClassController.addBulkTeachers
);

// get teacher avatar
router.get("/:id/avatar", teachersController.getAvatar);

// update a teacher via email and name
router.put("/", teacherAuth, teachersController.updateTeacher);

// teacher add student to class
// by passing the studentId to the body of the request
router.post(
  "/add-student/:classId",
  teacherAuth,
  teachersClassControllerV2.addStudentToClass
);

// Send questions to all students
/**
 * array of valid students ids is required
 * array of question is required
 * classId
 * Due date
 */
router.post(
  "/send-quiz/:classId",
  teacherAuth,
  teachersController.sendQuizToStudents
);

router.post(
  "/send-lab/:classId",
  teacherAuth,
  teachersController.sendLabToStudents
);

/*
 */

// Teacher Invite student to join class using the student  email
// the request body should contain the email of a student

router.post(
  "/invite-student",
  teacherAuth,
  teachersController.sendInviteToStudent
);

// teacher accept student invitation
router.post(
  "/accept-invite/:studentId",
  teacherAuth,
  teachersController.acceptStudentInvite
);

// get a teacher
router.get("/:id", teachersController.getTeacher);
// Get: all students
export default router;
