const express = require('express')
const loginController = require('../controllers/loginController')
const router = express.Router()

// login and signup with googleOAUTH for teacher

router.post('/teachers/auth/google', loginController.teacherGoogleAuth)

router.post('/teachers', loginController.teacherLogin)

router.post(
    '/students/auth/google',

    loginController.studentGoogleAuth,
)

router.post('/students', loginController.studentLogin)

router.post('/lab/students', loginController.studentLabLogin)

module.exports = router