const express = require("express");
const { teacherAuth, studentAuth } = require("../middleware/auth");

const teachersClassController = require("../controllers/teachersClassController");
const teachersClassControllerV2 = require("../controllers/V2/teacherClassController");
const router = express.Router();

// get all student from class

router.get("/:classId/students", teacherAuth, teachersClassController.getStudents);

// add a student to class
router.post("/:classId/add-student", teacherAuth, teachersClassControllerV2.addStudentToClass);

// get class quiz
router.get("/:classId/added-quiz", teacherAuth, teachersClassController.getAllQuiz);
router.get("/:classId/added-lab", teacherAuth, teachersClassController.getAllLab);

router.get("/:classId/published-class", teacherAuth, teachersClassController.getPublishedClassData);

// delete question from class and from list of questions
router.delete("/:classId/questions/:questionId", teacherAuth, teachersClassController.deleteQuiz);

// delete lab from class and from list of questions
router.delete("/:classId/labs/:labId", teacherAuth, teachersClassController.deleteLab);

// delete a class that is not published class
router.delete("/:classId", teacherAuth, teachersClassController.deleteUnpublishedClass);

// get a class by id => a bug needs to be fix
router.get("/:classId", teachersClassController.getClass);

// remove a student from a class
router.delete("/:classId/:studentId", teacherAuth, teachersClassController.deleteStudentFromClass);

module.exports = router;