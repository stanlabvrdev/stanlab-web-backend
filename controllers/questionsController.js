const { Question, validateQuestion } = require('../models/question')
const { TeacherClass } = require('../models/teacherClass')
const { cloudinary } = require('../utils/cloudinary')

async function getQuiz(req, res) {
    const { classId } = req.params
    const teacherClass = await TeacherClass.findOne({ _id: classId })
    const quiz = teacherClass.quiz
    console.log(quiz)
    res.send(quiz)
}

async function createQuestion(req, res) {
    const { error } = validateQuestion(req.body)
    const { classId } = req.params
    try {
        const teacherClass = await TeacherClass.findOne({ _id: classId })
        if (!teacherClass)
            return res.status(400).send({ message: 'Please create your class first' })
        let { questionText, options, points, image } = req.body
            // dueDate = new Date(dueDate)
        let subject = teacherClass.subject
        if (error) return res.status(400).send(error.details[0].message)
        let question = await Question.findOne({ questionText })
        if (question) return res.status(400).send('This question already exist')
        question = new Question({
            questionText,
            options,
            subject,
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
                    if (error) {
                        return res.send({ message: error.message })
                    }
                    console.log('Cloudinary error: ', error)
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
}

async function deleteQuestion(req, res) {
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
}

async function getQuestion(req, res) {
    const questionId = req.params.questionId
    if (!questionId)
        return res.status(404).send({ message: 'Question not found' })
    try {
        const question = await Question.findOne({ _id: questionId })
        if (!question)
            return res.status(404).send({ message: 'Question Not found' })
        res.send(question)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Something went wrong' })
    }
}
async function postManyQuestions(req, res) {
    const { questionIds } = req.body

    if (!questionIds || !Array.isArray(questionIds))
        return res.status(400).send({ message: 'Invalid request' })

    try {
        const questions = await Question.find({ _id: { $in: questionIds } })
            // console.log(questions)
        res.send(questions)
    } catch (error) {
        console.log(error)
        res.status(500).send({ message: 'Something went wrong' })
    }
}
module.exports = {
    createQuestion,
    deleteQuestion,
    getQuiz,
    getQuestion,
    postManyQuestions,
}