const express = require('express')
const { teacherAuth, studentAuth } = require('../middleware/auth')

const labSetupController = require('../controllers/labSetupController')

const router = express.Router()

/**
 * student [] are added to class as arrays of students ids
 * because a teacher can create multiple class with different student
 *
 */

router.post(
    '/create-lab/:classId',
    teacherAuth,
    labSetupController.postCreateLab,
)

// set x-auth-token in header
router.get(
    '/student/active-experiment/:experimentId',
    studentAuth,
    labSetupController.getActiveExperiment,
)
router.post('/experiments', labSetupController.getExperiments)

router.post(
    '/student/active-experiment/result',
    studentAuth,
    labSetupController.postLabResult,
)

module.exports = router