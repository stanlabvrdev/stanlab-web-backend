const sharp = require('sharp')
const bcrypt = require('bcryptjs')
const _ = require('lodash')

const {
    Teacher,
    validateTeacher,
    validateUpdateTeacher,
} = require('../models/teacher')
const { Student } = require('../models/student')
const { TeacherClass, validateClass } = require('../models/teacherClass')
const QuizClasswork = require('../models/quizClasswork')
const sendInvitation = require('../services/email')

async function deleteStudent(req, res) {
    const { studentId } = req.params
    try {
        let teacher = await Teacher.findOne({ _id: req.teacher._id })
        let student = await Student.findOne({ _id: studentId })

        let updatedTeacher = teacher.removeStudent(studentId)
        if (!updatedTeacher)
            return res.status(404).send({ message: 'Student not found' })

        await updatedTeacher.save()
        if (!student) return res.status(400).send({ message: 'Something is wrong' })

        student = student.markTeacherAsRemoved(teacher._id)
        await student.save()
        res.status(204).send(true)
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function createClass(req, res) {
    const { title, subject, section } = req.body
    const { error } = validateClass(req.body)
    if (error) return res.status(400).send({ message: error.details[0].message })

    try {
        const teacher = await Teacher.findOne({ _id: req.teacher._id })
        let teacherClass = new TeacherClass({
            title,
            subject,
            section,
            teacher: req.teacher._id,
        })

        teacherClass = await teacherClass.save()
        teacher.classes.push(teacherClass._id)
        await teacher.save()
        res.send(teacherClass)
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'error creating' })
    }
}

async function getClass(req, res) {
    try {
        const teacherClasses = await Teacher.findOne({ _id: req.teacher._id })
            .populate('classes')
            .select('classes')
        res.send(teacherClasses)
    } catch (error) {
        res.status(500).send({ message: 'Something went wrong' })
        console.log(error.message)
    }
}

async function createAvatar(req, res) {
    try {
        const teacher = await Teacher.findById(req.teacher._id)
        teacher.avatar = await sharp(req.file.buffer)
            .resize({ width: 180, height: 180 })
            .png()
            .toBuffer()
        await teacher.save()
        res.send({ message: 'successful' })
    } catch (error) {
        res.status(400).send({ message: 'Invalid ID' })
    }
}

async function getAvatar(req, res) {
    try {
        const teacher = await Teacher.findById(req.params.id)
        if (!teacher || !teacher.avatar)
            return res.status(404).send({ message: 'Not Found' })
        res.set('Content-Type', 'image/png').send(teacher.avatar)
    } catch (error) {
        res.status(400).send({ message: 'Invalid ID' })
    }
}

async function createTeacher(req, res) {
    const { error } = validateTeacher(req.body)
    let { name, email, password } = req.body
    if (error) return res.status(400).send(error.details[0].message)
    const registeredStudent = await Student.findOne({ email })
    if (registeredStudent)
        return res
            .status(401)
            .send({ message: 'You cannot use same email registered as Student' })
    const salt = await bcrypt.genSalt(10)
    password = await bcrypt.hash(password, salt)
    let teacher = await Teacher.findOne({ email })
    if (teacher)
        return res.status(400).send({ message: 'Email already Registered' })
    teacher = new Teacher({
        name,
        password,
        email,
    })

    await teacher.save()
    const token = teacher.generateAuthToken()
    res
        .header('x-auth-token', token)
        .header('access-control-expose-headers', 'x-auth-token')
        .send(_.pick(teacher, ['name', 'email', 'questions', 'students']))
}

async function updateTeacher(req, res) {
    try {
        const teacher = await Teacher.findById(req.teacher._id)
        if (!teacher)
            return res.status(404).send({ message: 'teacher was not found' })

        const { email, name } = req.body
        const { error } = validateUpdateTeacher(req.body)

        if (error) return res.status(400).send(error.details[0].message)
        teacher.name = name
        teacher.email = email
        await teacher.save()
        res.send(teacher)
    } catch (error) {
        console.log(error.message)
        res.status(500).send('Something went wrong')
    }
}

async function addStudentToClass(req, res) {
    const { classId } = req.params
    const { studentId } = req.body
    if (!studentId)
        return res.status(400).send({ message: 'studentId is required' })
    try {
        const teacherClass = await TeacherClass.findOne({ _id: classId })
        const student = await Student.findOne({ _id: studentId })
        if (!student) return res.status(404).send({ message: 'student not found' })
        const classStudents = teacherClass.students
        if (classStudents.find((s) => s.toString() === studentId.toString()))
            return res
                .status(400)
                .send({ message: 'student already added to this class' })
        if (student.classes.find((c) => c.toString() === classId.toString()))
            return res.status(400).send({ message: 'student already in this class' })
        student.classes.push(classId)
        teacherClass.students.push(student._id)
        await student.save()
        await teacherClass.save()
        res.send(teacherClass)
    } catch (error) {
        res.status(400).send({ message: 'Invalid class or student id' })
        console.log(error.message)
    }
}

async function sendQuizToStudents(req, res) {
    const { classId } = req.params
    let { dueDate, students, questions, startDate } = req.body

    if (!Array.isArray(students) && !Array.isArray(questions))
        return res
            .status(400)
            .send({ message: 'students and question must be array of objectIds' })

    if (questions.length === 0)
        return res
            .status(400)
            .send({ message: 'Please add questions to this class' })
    if (students.length === 0)
        return res
            .status(400)
            .send({ message: 'Please add students to this class' })

    if (startDate) startDate = new Date(startDate)
    else startDate = Date.now

    try {
        let newQuiz = new QuizClasswork({
            questions,
            students,
            dueDate,
            startDate,
            teacher: req.teacher._id,
            classId,
        })
        newQuiz = await newQuiz.save()
        for (let studentData of students) {
            // console.log('From send quiz route  student are = ', studentData)
            const student = await Student.findOne({ _id: studentData.student })
            if (student && studentData.isAccepted) {
                student.classworks.quizClasswork.push(newQuiz._id)
                await student.save()
            }
        }
        let teacherClass = await TeacherClass.findOne({ _id: classId })
        teacherClass = teacherClass.publishClass(classId)
        teacherClass.classwork.quiz = []
        teacherClass = teacherClass.addSentQuiz(newQuiz._id)
        await teacherClass.save()

        let teacher = await Teacher.findOne({ _id: req.teacher._id })
        teacher = teacher.addSentQuizClasswork(newQuiz._id)
        await teacher.save()
        res.send({ message: 'Sent!' })
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
        console.log(error)
    }
}

async function sendInviteToStudent(req, res) {
    // const { studentEmail, classId } = req.body
    const { studentEmail } = req.body
    const { _id } = req.teacher
    if (!studentEmail)
        return res.status(400).send({ message: 'Please include student Email' })

    try {
        let teacher = await Teacher.findOne({ _id })
        let student = await Student.findOne({ email: studentEmail })

        // save student in class

        /**
         * Tasks => student should be added from the list of teacher students
         * invite student from a class should be from pool of students
         */
        if (teacher.email === studentEmail)
            return res
                .status(400)
                .send({ message: "You can't send invite to yourself" })
        if (student) {
            const isStudent = teacher.checkStudentById(student._id)
            if (isStudent)
                return res
                    .status(400)
                    .send({ message: 'Invitation already sent to this student' })

            // add student to class

            // add student to teacher list of students
            teacher = teacher.addStudent(student._id)

            // add teacher to student list
            student = student.addTeacher(teacher._id, 'teacher')

            sendInvitation(teacher, student, 'teacher')

            await teacher.save()
            await student.save()
            return res.send({ message: 'Invitation sent!' })
        }

        if (!student) {
            teacher = teacher.addUnregisterStudent(studentEmail)
            sendInvitation(teacher, { email: studentEmail, name: '' }, 'teacher')
            await teacher.save()
            return res.send({ message: 'Invitation sent' })
        }
    } catch (ex) {
        console.log(ex)
        res.status(500).send({ message: 'Something went wrong' })
    }
}

async function acceptStudentInvite(req, res) {
    const studentId = req.params.studentId
    try {
        let teacher = await Teacher.findOne({ _id: req.teacher._id })
        let student = await Student.findOne({ _id: studentId })
        teacher = teacher.acceptStudent(studentId)
        student = student.acceptTeacher(teacher._id)

        await student.save()
        await teacher.save()
        res.send({ message: 'Invite accepted' })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function getTeacher(req, res) {
    try {
        const teacher = await Teacher.findById(req.params.id).select(
            '-password -avatar',
        )
        if (!teacher)
            return res
                .status(404)
                .send({ message: 'Teacher with this ID was not found' })
        res.send(teacher)
    } catch (error) {
        console.log(error.message)
        res.status(400).send({ message: 'Invalid teacher ID' })
    }
}

async function getStudents(req, res) {
    try {
        const students = await Teacher.findOne({ _id: req.teacher._id })
            .populate({
                path: 'students.student',
                select: 'name email imageUrl avatar _id isAccepted',
            })
            .select('students')
        res.send(students)
    } catch (error) {
        res.status(500).send({ message: 'Something went wrong' })
        console.log(error.message)
    }
}
module.exports = {
    acceptStudentInvite,
    addStudentToClass,
    createAvatar,
    createClass,
    createTeacher,
    deleteStudent,
    getAvatar,
    getClass,
    getStudents,
    getTeacher,
    sendQuizToStudents,
    sendInviteToStudent,
    updateTeacher,
}