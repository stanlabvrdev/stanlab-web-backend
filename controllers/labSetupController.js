const config = require('config')
const fetch = require('node-fetch')

const LabSetup = require('../models/labSetup')
const { TeacherClass } = require('../models/teacherClass')

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

async function sendCreateLabToServer(req, res) {
    const { classId, labId } = req.params

    try {
        const teacherClass = await TeacherClass.findOne({ _id: classId })
        const labsetupId = teacherClass.classwork.lab.find(
            (lab) => lab.toString() === labId.toString(),
        )

        if (!labsetupId) return res.status(404).send({ message: 'no lab found' })
        const labsetupData = await LabSetup.findOne({ _id: labsetupId })
        console.log(labsetupData)
        if (!labsetupData.students.find(
                (s) => s.toString() == req.student._id.toString(),
            ))
            return res.status(403).send({ message: 'Not authorized' })
        const response = await fetch(config.get('lab_backend_url'), {
            method: 'POST',
            body: JSON.stringify(labsetupData),
            headers: { 'Content-Type': 'application/json' },
        })

        const result = await response.json()
        console.log(response, result)

        return res.send({ result })
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'unable to send ' })
    }
}
module.exports = {
    postCreateLab,
    sendCreateLabToServer,
}