const config = require('config')
const fetch = require('node-fetch')

const LabSetup = require('../models/labSetup')
const { TeacherClass } = require('../models/teacherClass')
const { Student } = require('../models/student')

async function postCreateLab(req, res) {
    const { classId } = req.params
    let {
        acidName,
        baseName,
        indicatorName,
        acidVolume,
        baseVolume,
        dueDate,
        points,
        students,
        experiment,
        subject,
    } = req.body
    const teacherClass = await TeacherClass.findOne({ _id: classId })

    dueDate = new Date(dueDate)
    let labsetup = new LabSetup({
        experiment,
        subject,
        acidName,
        baseName,
        acidVolume,
        baseVolume,
        indicatorName,
        dueDate,
        points,
        students,
    })
    try {
        labsetup.teacher = req.teacher._id
        labsetup = await labsetup.save()
        teacherClass.classwork.lab.push(labsetup._id)
        await teacherClass.save()
        res.send(labsetup)
    } catch (error) {
        console.log(error.meddage)
        res.status(500).send({ message: 'something went wrong' })
    }
}

async function getActiveExperiment(req, res) {
    const { experimentId } = req.params

    try {
        const experiment = await LabSetup.findOne({ _id: experimentId })

        if (!experiment) return res.status(404).send({ message: 'Not Found' })
        res.send(experiment)
    } catch (error) {
        console.log(error)
        res.send({ message: 'Something went wrong' })
    }
}

async function postLabResult(req, res) {
    const { experimentId, scores, experiment } = req.body
    if (!experimentId || !scores || !experiment)
        return res
            .status(400)
            .send({ message: 'Please provide "experimentId" and "scores"' })
    try {
        let student = await Student.findOne({ _id: req.student._id })
        student = student.addCompleteExperiment(experimentId, scores, experiment)
        await student.save()
        res.send(true)
    } catch (error) {
        console.log(error)
        res.send({ message: 'Something went wrong' })
    }
}
module.exports = {
    postCreateLab,
    getActiveExperiment,
    postLabResult,
}