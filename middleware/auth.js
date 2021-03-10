const jwt = require('jsonwebtoken')
const config = require('config')

function teacherAuth(req, res, next) {
    const token = req.header('x-auth-token')

    if (!token) return res.status(401).send('Access Denied!. No token provided')
    try {
        const decoded = jwt.verify(token, config.get('jwtKey'))
            // check to see if the role is teacher -> send 403
        if (decoded.role !== 'Teacher')
            return res.status(403).send('Access Denied!.')
        req.teacher = decoded
        next()
    } catch (error) {
        res.status(400).send('Invalid token')
    }
}

function studentAuth(req, res, next) {
    const token = req.header('x-auth-token')

    if (!token) return res.status(401).send('Access Denied!. No token provided')
    try {
        const decoded = jwt.verify(token, config.get('jwtKey'))
        if (decoded.role !== 'Student')
            return res.status(403).send('Access Denied!.')
        req.student = decoded
        next()
    } catch (error) {
        res.status(400).send('Invalid token')
    }
}

function schoolAuth(req, res, next) {
    const token = req.header('x-auth-token')

    if (!token) return res.status(401).send('Access Denied!. No token provided')
    try {
        const decoded = jwt.verify(token, config.get('jwtKey'))
        if (decoded.role !== 'School')
            return res.status(403).send('Access Denied!.')
        req.school = decoded
        next()
    } catch (error) {
        res.status(400).send('Invalid token')
    }
}

module.exports = { teacherAuth, studentAuth, schoolAuth }