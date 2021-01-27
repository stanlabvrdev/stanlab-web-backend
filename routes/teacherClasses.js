const express = require('express')
const { teacherAuth } = require('../middleware/auth')

const teachersClassController = require('../controllers/teachersClassController')
const router = express.Router()

// get all student from class

router.get(
    '/:classId/students',
    teacherAuth,
    teachersClassController.getStudents,
)

// add a student to class
router.post(
    '/:classId/add-student',
    teacherAuth,
    teachersClassController.addStudentToClass,
)

// get class quiz
router.get(
    '/:classId/added-quiz',
    teacherAuth,
    teachersClassController.getAllQuiz,
)

// delete question from class and from list of questions
router.delete(
    '/:classId/questions/:questionId',
    teacherAuth,
    teachersClassController.deleteQuiz,
)

// delete a class that is not published class
router.delete(
    '/:classId',
    teacherAuth,
    teachersClassController.deleteUnpublishedClass,
)

// get a class by id
router.get('/:classId', teacherAuth, teachersClassController.getClass)

// remove a student from a class
router.delete(
    '/:classId/:studentId',
    teacherAuth,
    teachersClassController.deleteStudentFromClass,
)

module.exports = router