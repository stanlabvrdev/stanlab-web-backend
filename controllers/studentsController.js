const bcrypt = require('bcryptjs')
const _ = require('lodash')
const sendInvitation = require('../services/email')
const { Student, validateStudent } = require('../models/student')
const { Teacher } = require('../models/teacher')

async function inviteTeacher(req, res) {
    let { teacherEmail } = req.body
    const { _id } = req.student
    if (!teacherEmail)
        return res.status(400).send({ message: 'teacherEmail is required' })

    try {
        let student = await Student.findOne({ _id })
        let teacher = await Teacher.findOne({ email: teacherEmail })

        if (!teacher) {
            sendInvitation(teacher, student, 'student')
            return res.send({
                message: 'Teacher not on platform, request has been sent to Teacher email',
            })
        }

        if (student.checkTeacherById(teacher._id))
            return res
                .status(400)
                .send({ message: 'Invite already sent to this teacher' })

        student = student.addTeacher(teacher._id)

        teacher = teacher.addStudent(student._id, 'student')

        // send mail to student
        // this method may not need to be waited in the future -> decision has to be made here on this
        sendInvitation(teacher, student, 'student')

        await teacher.save()
        await student.save()

        res.send({ message: 'Invitation sent' })
    } catch (ex) {
        console.log(ex.message)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function createStudent(req, res) {
    const { error } = validateStudent(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    let { name, email, password, studentClass, teacher } = req.body
    const teacherEmail = await Teacher.findOne({ email })
    if (teacherEmail)
        return res
            .status(400)
            .send({ message: 'You cannot use same email registered as  teacher' })
    let student = await Student.findOne({ email })
    if (student) return res.status(400).send('Email already registered')
    const salt = await bcrypt.genSalt(10)
    password = await bcrypt.hash(password, salt)
    student = new Student({
        name,
        email,
        password,
        studentClass,
        teacher,
    })
    await student.save()
    const token = student.generateAuthToken()
    res
        .header('x-auth-token', token)
        .header('access-control-expose-headers', 'x-auth-token')
        .send(_.pick(student, ['name', 'email', 'studentClass', 'teacher']))
}

async function getStudent(req, res) {
    try {
        const student = await Student.findById(req.student._id).select(
            '-password -__v -avatar',
        )

        res.send(student)
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function acceptTeacher(req, res) {
    const teacherId = req.params.teacherId
    try {
        let student = await Student.findOne({ _id: req.student._id })
        let teacher = await Teacher.findOne({ _id: teacherId })

        teacher = teacher.acceptStudent(student._id)
        student = student.acceptTeacher(teacherId)

        await teacher.save()
        await student.save()
        res.send({ message: 'Invite accepted' })
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function deleteTeacher(req, res) {
    const { teacherId } = req.params
    try {
        let teacher = await Teacher.findOne({ _id: teacherId })
        let student = await Student.findOne({ _id: req.student._id })
        let updatedStudent = student.removeTeacher(teacherId)
        if (!updatedStudent)
            return res.status(404).send({ message: 'Teacher not found' })

        await updatedStudent.save()
        if (!teacher) return res.status(400).send({ message: 'Something is wrong' })

        teacher = teacher.markStudentAsRemoved(student._id)
        await teacher.save()
        res.status(204).send(true)
    } catch (error) {
        if (error.kind === 'ObjectId')
            return res.status(404).send({ message: 'Teacher not found' })
        console.log(error.message)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function declineInvite(req, res) {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.teacherId })
        const student = await Student.findOne({ _id: req.student._id })
        if (!teacher)
            return res.status(404).send({ message: 'Teacher does not exist' })
                // console.log(teacher);
        let teacherIndex = student.teachers.findIndex((t) => {
            console.log(t)
            return t._id.toString() === req.params.teacherId.toString()
        })

        if (teacherIndex < 0)
            return res.status(404).send({ message: 'Teacher does not exist!' })

        const teacherStudent = teacher.students.find((s) => {
            console.log(s)
            return s._id.toString() === req.student._id.toString()
        })
        teacherStudent.status = 'declined'
        student.teachers.splice(teacherIndex, 1)
        await student.save()
        await teacher.save()
        res.send({ message: ' declined' })
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'student went wrong' })
    }
}

async function getQuizClasswork(req, res) {
    const { classId } = req.params

    if (!classId)
        return res
            .status(400)
            .send({ message: 'Invalid request, teacher classId not found' })
    try {
        let student = await Student.findOne({ _id: req.student._id })
        if (!student) return res.status(404).send({ message: 'Student not found' })
        const teacherClass = await TeacherClass.findOne({ _id: classId })
        if (!teacherClass)
            return res.status(404).send({ message: 'class not found' })
        const quizs = teacherClass.classwork.quiz
        if (quizs.length === 0) return res.send(quizs)

        if (
            student.classwork &&
            student.classwork.some((c) => c.classId.toString() === classId.toString())
        ) {
            const getQ = await student
                .populate({ path: 'classwork.quizs' })
                .execPopulate()
            return res.send(_.pick(getQ, ['classwork']))
        }
        async function getQuiz() {
            let classwork = {
                classId: '',
                quizs: [],
                lab: [],
            }
            classwork.classId = classId
            for (let i = 0; i < quizs.length; i++) {
                const question = await Question.findOne({ _id: quizs[i] })

                if (question.isSend) {
                    classwork.quizs.push(quizs[i])
                }
            }
            if (classwork.quizs.length === 0)
                return res.send({
                    message: "You don't have active question from this class",
                })
            student.classwork.push(classwork)
            student = await student.save()
            const getQ = await student.populate('classwork.quizs').execPopulate()

            res.send(_.pick(getQ, ['classwork']))
        }

        await getQuiz()
    } catch (error) {
        console.log(error.message)
        res.status(400).send({ message: 'something went wrong' })
    }
}

async function getAvatar(req, res) {
    try {
        const student = await Student.findById(req.params.id)
        if (!student || !student.avatar)
            return res.status(404).send({ message: 'Not Found' })
        res.set('Content-Type', 'image/png').send(student.avatar)
    } catch (error) {
        res.status(400).send({ message: 'Invalid ID' })
    }
}
module.exports = {
    acceptTeacher,
    createStudent,
    declineInvite,
    deleteTeacher,
    getAvatar,
    getQuizClasswork,
    getStudent,
    inviteTeacher,
}