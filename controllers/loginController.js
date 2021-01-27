const { OAuth2Client } = require('google-auth-library')
const config = require('config')
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const Joi = require('joi')
const { Teacher } = require('../models/teacher')
const { Student } = require('../models/student')
const generateRandomString = require('../utils/randomStr')

function validateAuth(auth) {
    const schema = Joi.object({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
    })

    return schema.validate(auth)
}

async function teacherGoogleAuth(req, res) {
    const client = new OAuth2Client(config.get('teacher_google_CLIENT_ID'))
    const { tokenId } = req.body
    if (!tokenId) return res.status(400).send({ message: 'token ID Not found' })

    try {
        const {
            payload: { email_verified, name, email, picture },
        } = await client.verifyIdToken({
            idToken: tokenId,
            audience: config.get('teacher_google_CLIENT_ID'),
        })
        if (email_verified) {
            // check if this email as registered as a teacher
            const isStudent = await Student.findOne({ email })
            if (isStudent)
                return res.status(403).send({ message: 'Email registered as Student' })
            const teacher = await Teacher.findOne({ email })
            if (teacher) {
                // login
                const token = teacher.generateAuthToken()
                res.send(token)
            } else {
                let password = email + generateRandomString(10)
                const salt = await bcrypt.genSalt(10)
                password = await bcrypt.hash(password, salt)
                    // create new teacher
                let teacher = new Teacher({
                    email,
                    password,
                    name,
                    email,
                    imageUrl: picture,
                })
                await teacher.save()
                const token = teacher.generateAuthToken()
                res.send(token)
            }
        }
    } catch (error) {
        res.status(400).send({ message: 'Invalid google token ID' })
        console.log(error.message)
    }
}

async function teacherLogin(req, res) {
    const { email, password } = req.body
    const { error } = validateAuth(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    const teacher = await Teacher.findOne({ email })
    if (!teacher) return res.status(400).send('Invalid Credentials')

    const isValid = await bcrypt.compare(password, teacher.password)

    if (!isValid) return res.status(400).send('Invalid credentials')
    const token = teacher.generateAuthToken()
    res.send(token)
}

async function studentGoogleAuth(req, res) {
    const client = new OAuth2Client(config.get('student_google_CLIENT_ID'))
    const { tokenId } = req.body
    if (!tokenId) return res.status(400).send({ message: 'token ID Not found' })

    try {
        const {
            payload: { email_verified, name, email, picture },
        } = await client.verifyIdToken({
            idToken: tokenId,
            audience: config.get('student_google_CLIENT_ID'),
        })
        if (email_verified) {
            // check if this email as registered as a teacher
            const isTeacher = await Teacher.findOne({ email })
            if (isTeacher)
                return res.status(403).send({ message: 'Email registered as Teacher' })
            const student = await Student.findOne({ email })
            if (student) {
                // login
                const token = student.generateAuthToken()
                res.send(token)
            } else {
                let password = email + generateRandomString(10)
                const salt = await bcrypt.genSalt(10)
                password = await bcrypt.hash(password, salt)
                    // create new teacher
                let student = new Student({
                    email,
                    password,
                    name,
                    email,
                    imageUrl: picture,
                })
                await student.save()
                const token = student.generateAuthToken()
                res.send(token)
            }
        }
    } catch (error) {
        res.status(400).send({ message: 'Invalid google token ID' })
        console.log(error.message)
    }
}

async function studentLogin(req, res) {
    const { email, password } = req.body
    const { error } = validateAuth(req.body)
    if (error) return res.status(400).send(error.details[0].message)
    const student = await Student.findOne({ email })
    if (!student) return res.status(400).send('Invalid Credentials')

    const isValid = await bcrypt.compare(password, student.password)

    if (!isValid) return res.status(400).send('Invalid credentials')
    const token = student.generateAuthToken()
    res.send(token)
}
module.exports = {
    studentGoogleAuth,
    studentLogin,
    teacherGoogleAuth,
    teacherLogin,
}