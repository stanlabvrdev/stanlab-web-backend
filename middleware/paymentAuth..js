const { Student } = require('../models/student')
const constants = require('../utils/constants')
module.exports = async function(req, res, next) {
    const student = await Student.findOne({ _id: req.student._id })
    const plan = student.plan.name
    if (!plan || student.teacher.length < 1) next()

    if (plan && plan === constants.plans.basic && student.teachers.length === 1) {
        return res
            .status(401)
            .send({ message: 'You have exceeded the number of teacher you can add' })
    }
}