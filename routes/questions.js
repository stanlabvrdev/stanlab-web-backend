const express = require('express')
const { Question, validateQuestion } = require('../models/question')
const { teacherAuth } = require('../middleware/auth')
const { Teacher } = require('../models/teacher')
const { TeacherClass } = require('../models/teacherClass')
const { cloudinary } = require('../utils/cloudinary')
const router = express.Router()

router.get('/quiz/:classId', teacherAuth, async(req, res) => {
    const { classId } = req.params
    const teacherClass = await TeacherClass.findOne({ _id: classId })
    const quiz = teacherClass.quiz
    console.log(quiz)
    res.send(quiz)
})

/* only authenticated teacher can create a question
Post: Teacher set Quiz question
add questions to list of questions and add reference to the class
*/

router.post('/quiz/:classId', teacherAuth, async(req, res) => {
    const { error } = validateQuestion(req.body)
    const { classId } = req.params
    try {
        const teacherClass = await TeacherClass.findOne({ _id: classId })
        if (!teacherClass)
            return res.status(400).send({ message: 'Please create your class first' })
        let { questionText, options, dueDate, points, image } = req.body
        dueDate = new Date(dueDate)
        let subject = teacherClass.subject
        if (error) return res.status(400).send(error.details[0].message)
        let question = await Question.findOne({ questionText })
        if (question) return res.status(400).send('This question already exist')
        question = new Question({
            questionText,
            options,
            subject,
            dueDate,
            points,
            teacher: req.teacher._id,
            teacherClass: classId,
        })

        if (image) {
            await cloudinary.uploader.upload(
                image, {
                    upload_preset: 'teacher_quiz',
                },
                async(error, result) => {
                    if (!error) question.imageUrl = result.url

                    console.log(error)
                },
            )
        }

        question = await question.save()
        teacherClass.classwork.quiz.push(question._id)
        await teacherClass.save()

        res.send(question)
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'something went wrong' })
    }
})

// teacher delete quiz
router.delete('/quiz/:quizId', teacherAuth, async(req, res) => {
    const { quizId } = req.params
    try {
        const quiz = await Question.findOne({ _id: quizId })
        if (!quiz)
            return res.status(404).send({ message: 'Quiz with this ID not found' })
        const teacherClass = await TeacherClass.findOne({
            _id: quiz.teacherClass,
        })
        const classworkQuiz = teacherClass.classwork.quiz
        const indx = classworkQuiz.findIndex(
            (w) => w.toString() === quizId.toString(),
        )
        classworkQuiz.splice(indx, 1)
        await teacherClass.save()
        await Question.deleteOne({ _id: quizId })
        res.send({ message: 'deleted' })
    } catch (error) {
        console.log(error.message)
        res.status(500).send({ message: 'something went wrong' })
    }
})

/* only authenticated teacher can post a question
Post: Teacher set Lab question
*/

router.post('/lab', teacherAuth, async(req, res) => {
    res.send('Lab questions')
})
module.exports = router