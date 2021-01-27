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
    // "lab_backend_port": 5000

/**
 * every students in the class can access this route
 * and get redirect to chucks url
 */
router.get(
    '/:classId/:labId',
    studentAuth,
    labSetupController.sendCreateLabToServer,
)

module.exports = router