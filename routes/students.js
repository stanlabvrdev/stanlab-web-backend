const express = require('express')

// const { studentPassport } = require('../services/initPassport')
// const passportAuth = require('../middleware/studentPassportAuth')
const { studentAuth } = require('../middleware/auth')
const paymentAuth = require('../middleware/paymentAuth.')
const studentsController = require('../controllers/studentsController')

const router = express.Router()

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
router.post(
    '/invite-teacher', [studentAuth, paymentAuth],
    studentsController.inviteTeacher,
)

// Post: Register a new Student

router.post('/', studentsController.createStudent)

// get login  student
router.get('/', studentAuth, studentsController.getStudent)

// student accept teacher Invite
router.post(
    '/accept-invite/:teacherId',
    studentAuth,
    studentsController.acceptTeacher,
)

// delete only teacher
router.delete(
    '/teachers/:teacherId',
    studentAuth,
    studentsController.deleteTeacher,
)

// student decline teacher request
router.post(
    '/decline-invite/:teacherId',
    studentAuth,
    studentsController.declineInvite,
)

// get student classwork
router.get(
    '/classwork/:classId',
    studentAuth,
    studentsController.getQuizClasswork,
)

// get student avatar
router.get('/:id/avatar', studentsController.getAvatar)

module.exports = router