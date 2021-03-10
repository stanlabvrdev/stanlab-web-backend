const {
    SchoolAdmin,
    validateSchoolAdmin,
    validateSchoolUser,
} = require('../models/schoolAdmin')
const bcrypt = require('bcryptjs')
const _ = require('lodash')
const { Teacher } = require('../models/teacher')
const { Student } = require('../models/student')
const generateRandomString = require('../utils/randomStr')
const { sendLoginDetails } = require('../services/email')
const constants = require('../utils/constants')
const moment = require('moment')

async function createSchoolAdmin(req, res) {
    const { error } = validateSchoolAdmin(req.body)

    if (error) return res.status(400).send({ message: error.details[0].message })
    let { adminName, schoolName, password, email } = req.body

    try {
        let school = await SchoolAdmin.findOne({ email })

        if (school)
            return res
                .status(400)
                .send({ message: 'School with this email already exists' })
        const salt = await bcrypt.genSalt(10)
        password = await bcrypt.hash(password, salt)

        school = new SchoolAdmin({ password, email, adminName, schoolName })

        await school.save()
        const token = school.generateAuthToken()
        res
            .header('x-auth-token', token)
            .header('access-control-expose-headers', 'x-auth-token')
            .send(_.pick(school, ['name', 'email', 'teachers', 'students', '_id']))
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function createTeacher(req, res) {
    const { error } = validateSchoolUser(req.body)
    if (error) return res.status(400).send({ message: error.details[0].message })

    const { name, email } = req.body
    let password = generateRandomString(7)
    try {
        let school = await SchoolAdmin.findOne({ _id: req.school._id })
        let teacher = await Teacher.findOne({ email })
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        if (teacher && teacher.checkIsSchool(school._id))
            return res
                .status(400)
                .send({ message: 'You have already added this teacher' })
        if (teacher) {
            sendLoginDetails(email, teacher.name, null, school.name)
            teacher.addSchool(school._id)
            school = school.addTeacher(teacher._id)
            await school.save()
            return res.send(true)
        }

        teacher = new Teacher({ name, email, password: hashedPassword })
        teacher.addSchool(school._id)

        await sendLoginDetails(email, name, password, school.name, true)
        await teacher.save()
        school = school.addTeacher(teacher._id)
        await school.save()
        res.send(true)
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
        console.log(error)
    }
}

async function createStudent(req, res) {
    const { error } = validateSchoolUser(req.body)
    if (error) return res.status(400).send({ message: error.details[0].message })

    const { name, email } = req.body
    let password = generateRandomString(7)
    try {
        let school = await SchoolAdmin.findOne({ _id: req.school._id })
        let student = await Student.findOne({ email })
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        if (student)
            return res.status(400).send({
                message: 'Student with this email address already registered on this platform',
            })

        student = new Student({ name, email, password: hashedPassword })
        student.school = req.school._id
        student[constants.trialPeriod.title] = moment().add(
            constants.trialPeriod.days,
            'days',
        )
        school = school.addStudent(student._id)

        await sendLoginDetails(email, name, password, school.name, true)
        await student.save()
        await school.save()
        res.send(true)
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
        console.log(error)
    }
}

async function getTeachers(req, res) {
    try {
        const schoolTeachers = await SchoolAdmin.findOne({
                _id: req.school._id,
            })
            .populate({
                path: 'teachers',
                select: '-students -password -role -schools -__v',
            })
            .select('teachers')
        res.send(schoolTeachers)
    } catch (error) {
        console.log(error)

        res.status(500).send({ message: 'something went wrong' })
    }
}

module.exports = {
    createSchoolAdmin,
    createTeacher,
    createStudent,
    getTeachers,
}