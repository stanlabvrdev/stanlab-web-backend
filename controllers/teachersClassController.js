const { Question } = require('../models/question')
const { Teacher } = require('../models/teacher')
const { TeacherClass } = require('../models/teacherClass')

async function deleteUnpublishedClass(req, res) {
    const { classId } = req.params
    try {
        let teacher = await Teacher.findOne({ _id: req.teacher._id })

        teacher = teacher.deleteClassById(classId)

        await teacher.save()
        await TeacherClass.deleteOne({ _id: classId })
        res.status(204).send(true)
    } catch (error) {
        if (error.kind === 'ObjectId')
            return res.status(404).send({ message: 'Class Not found' })

        res.status(500).send({ message: 'something went wrong' })
        console.log(error.message)
    }
}

async function getStudents(req, res) {
    try {
        const classData = await TeacherClass.findOne({
                _id: req.params.classId,
            })
            .populate({
                path: 'students',
                select: 'name email imageUrl avatar _id isAccepted',
            })
            .select('students, teacher')

        if (!classData) return res.status(404).send({ message: 'Class not found' })

        if (classData.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: 'Not autorized!' })

        res.send(classData)
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
        console.log(error)
    }
}

async function addStudentToClass(req, res) {
    const { studentId } = req.body
    try {
        let teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        })

        if (!teacherClass)
            return res.status(404).send({ message: 'Class not found' })

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: 'Not autorized!' })

        const isStudent = teacherClass.checkStudentById(studentId)
        if (isStudent)
            return res.status(400).send({ message: 'Student already added to class' })

        teacherClass = teacherClass.addStudentToClass(studentId)
        await teacherClass.save()

        res.send(true)
    } catch (error) {
        res.status(500).send({ message: 'something went wrong' })
        if (error.kind === 'ObjectId')
            return res.status(404).send({ message: 'Class not found' })
        console.log(error.message)
    }
}

async function getAllQuiz(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        }).populate({ path: 'classwork.quiz' })

        if (!teacherClass)
            return res.status(404).send({ message: 'Class not found' })

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: 'Not autorized!' })

        res.send(teacherClass)
    } catch (error) {
        res.status(400).send({ message: 'Invalid ID' })
        console.log(error.message)
    }
}

async function deleteQuiz(req, res) {
    const questionId = req.params.questionId
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        })

        if (!teacherClass)
            return res.status(404).send({ message: 'Class not found' })

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: 'Not autorized!' })
        const quiz = teacherClass.classwork.quiz

        const index = quiz.findIndex((q) => q.toString() === questionId.toString())
        if (index < 0)
            return res.status(404).send({ message: 'Question Not found' })

        quiz.splice(index, 1)
        await Question.deleteOne({ _id: questionId })
        await teacherClass.save()

        res.status(204).send(true)
    } catch (error) {
        res.status(400).send({ message: 'Invalid ID' })
        console.log(error.message)
    }
}

async function getClass(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({ _id: req.params.classId })

        if (!teacherClass)
            return res.status(404).send({ message: 'Class not found' })

        // if (teacherClass.teacher.toString() !== req.teacher._id.toString())
        //     return res.status(401).send({ message: 'Not autorized!' })

        res.send(teacherClass)
    } catch (error) {
        if (error.kind === 'ObjectId')
            return res.status(404).send({ message: 'Class Not found' })

        res.status(500).send({ message: 'something went wrong' })
        console.log(error.message)
    }
}

async function deleteStudentFromClass(req, res) {
    const { classId, studentId } = req.params

    try {
        let teacherClass = await TeacherClass.findOne({ _id: classId })

        if (!teacherClass)
            return res.status(404).send({ message: 'Class not found' })

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: 'Not autorized!' })

        if (!teacherClass.removeStudentFromClass(studentId))
            return res.status(404).send({ message: 'student not found' })

        teacherClass.removeStudentFromClass(studentId)

        await teacherClass.save()
        res.status(204).send(true)
    } catch (error) {
        console.log(error.message)
        if (error.kind === 'ObjectId')
            return res.status(400).send({ message: 'Invalid class Id' })
        res.status(500).send({ message: 'Something went wrong' })
    }
}
module.exports = {
    addStudentToClass,
    deleteQuiz,
    deleteStudentFromClass,
    deleteUnpublishedClass,

    getAllQuiz,
    getClass,
    getStudents,
}