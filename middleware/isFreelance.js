const { Student } = require('../models/student')

async function isFreelanceStudent(req, res, next) {
    if (!req.student)
        return res.status(403).send({ message: 'Not authenticated' })

    try {
        const student = await Student.findOne({ _id: req.student._id })
        if (!student.school) return next()

        return res
            .status(403)
            .send({
                message: 'You cannot perform this operation, please ask your school',
            })
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Something went wrong' })
    }
}

module.exports = { isFreelanceStudent }