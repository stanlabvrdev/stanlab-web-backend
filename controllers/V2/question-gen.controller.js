const {
    genQuestions,
    formatQuestions
} = require('../../services/questionGeneration')
const {
    GeneratedQuestions,
    QuestionGroup
} = require('../../models/generated-questions')
const axios = require('axios')
const CustomError = require('../../services/exceptions/custom')
const {
    ServerErrorHandler,
    ServerResponse
} = require('../../services/response/serverResponse')

async function genFromFile(req, res) {
    try {
        if (!req.file) throw new CustomError(400, 'No file uploaded')
        const questions = await genQuestions(req.file.mimetype, req.file.buffer)
        if (questions && questions.length !== 0) {
            const finalQuestions = formatQuestions(questions)
            return ServerResponse(req, res, 200, finalQuestions, 'Questions generated successfully')
        } else throw new CustomError(500, 'Question Generation unsuccessful')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function genFromText(req, res) {
    try {
        if (!req.body.text) throw new CustomError(400, 'Upload text to generate questions')
        const questions = (await axios.post('https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion', {
            context: req.body.text,
            option_set: "Wordnet" //Can be other or Wordnet
        })).data
        if (questions && questions.length !== 0) {
            const finalQuestions = formatQuestions([questions])
            return ServerResponse(req, res, 200, finalQuestions, 'Questions generated successfully')
        } else throw new CustomError(500, 'Question Generation unsuccessful')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}


async function saveQuestions(req, res) {
    try {
        const {
            subject,
            topic,
            questions
        } = req.body
        const questionSavePromises = questions.map((each) => GeneratedQuestions.create(each))
        const savedQuests = (await Promise.allSettled(questionSavePromises)).filter(each => each.status === 'fulfilled').map(each => each.value.id)
        const questGroup = await QuestionGroup.create({
            teacher: req.teacher._id,
            subject,
            topic,
            questions: savedQuests
        })
        return ServerResponse(req, res, 200, questGroup, 'Saved')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function getQuestions(req, res) {
    try {
        const questions = await QuestionGroup.find({
            teacher: req.teacher._id
        }).populate('questions')
        ServerResponse(req, res, 200, questions, 'Successful')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function deleteQuestionGroup(req, res) {
    try {
        const {
            id
        } = req.params
        const deletedGroup = await QuestionGroup.findByIdAndDelete(id)
        if (deletedGroup) return ServerResponse(req, res, 200, undefined, 'Deleted Successfully')
        else return ServerResponse(req, res, 404, undefined, 'Resource not found')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function getAQuestionGroup(req, res) {
    try {
        const {
            id
        } = req.params
        const questionGroup = await QuestionGroup.findOne({
            _id: id
        }).populate('questions')
        if (questionGroup) return ServerResponse(req, res, 200, questionGroup, 'Successful')
        else return ServerResponse(req, res, 404, undefined, 'Not found')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

module.exports = {
    genFromFile,
    genFromText,
    saveQuestions,
    getQuestions,
    deleteQuestionGroup,
    getAQuestionGroup
}