const express = require('express')
const router = express.Router()
const schoolAdminController = require('../controllers/schoolAdminsController')
const { schoolAuth } = require('../middleware/auth')

router.post('/', schoolAdminController.createSchoolAdmin)

router.post('/teachers', schoolAuth, schoolAdminController.createTeacher)
router.post('/students', schoolAuth, schoolAdminController.createStudent)
router.get('/teachers', schoolAuth, schoolAdminController.getTeachers)

module.exports = router