const { Student } = require('../models/student')
const constants = require('../utils/constants')
const moment = require('moment')

module.exports = async function(req, res, next) {
    try {
        const student = await Student.findOne({ _id: req.student._id })
        const expired = moment(student[constants.trialPeriod.title]).diff(
                moment(),
                's',
            )
            // console.log('from periodchecker middleware time =', expired)

        if (expired <= 0)
            return res.status(403).send({ message: 'You trial period is over' })
        else return next()
    } catch (error) {
        res.status(500).send({ message: 'An Error occured' })
        console.log(error)
    }
}