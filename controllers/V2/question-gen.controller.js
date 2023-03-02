const {
    genQuestions,
    formatQuestions,
    saveGeneratedQuestions,
    assignQuestions
} = require('../../services/questionGeneration')
const {
    GeneratedQuestions,
    QuestionGroup
} = require('../../models/generated-questions')
const mcqModel = require('../../models/MCQassignment')
const {
    Teacher
} = require('../../models/teacher')
const {
    TeacherClass
} = require('../../models/teacherClass')
const {
    Student
} = require('../../models/student')
const {
    createTopicalMcqNotification
} = require('../../services/student/notification')
const axios = require('axios')
const CustomError = require('../../services/exceptions/custom')
const {
    ServerErrorHandler,
    ServerResponse
} = require('../../services/response/serverResponse')

//For general use in queries here reduce processing time, returns regular js docs instead of mongoose docs
const populateOptions = {
    path: 'questions',
    select: '-__v',
    options: {
        lean: true
    }
}

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
        const questGroup = await saveGeneratedQuestions(questions, GeneratedQuestions, QuestionGroup, subject, topic, req)
        return ServerResponse(req, res, 200, questGroup, 'Saved')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function getQuestions(req, res) {
    try {
        const questions = await QuestionGroup.find({
            teacher: req.teacher._id
        }).populate(populateOptions)
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
        }).populate(populateOptions)
        if (questionGroup) return ServerResponse(req, res, 200, questionGroup, 'Successful')
        else return ServerResponse(req, res, 404, undefined, 'Not found')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function editQuestionGroup(req, res) {
    try {
        const id = req.params.id;
        const questions = req.body.questions
        const update = {
            subject: req.body.subject,
            topic: req.body.topic
        }
        const options = {
            new: true
        }
        const updatedQuestions = await Promise.allSettled(questions.map((each) => GeneratedQuestions.findByIdAndUpdate(each._id, each, options)))
        const updated = await QuestionGroup.findByIdAndUpdate(id, {
            $set: update
        }, options).populate(populateOptions)
        ServerResponse(req, res, 200, updated, 'Update successful')
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function assignNow(req, res) {
    try {
        const {
            subject,
            topic,
            questions,
        } = req.body
        const questGroup = await saveGeneratedQuestions(questions, GeneratedQuestions, QuestionGroup, subject, topic, req)
        req.body.questGroupId = questGroup._id
        await assignQuestions(req, Teacher, TeacherClass, QuestionGroup, Student, mcqModel, createTopicalMcqNotification)
        ServerResponse(req, res, 201, null, "Assignment successful");
    } catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function assignLater(req, res) {
    try {
        await assignQuestions(req, Teacher, TeacherClass, QuestionGroup, Student, mcqModel, createTopicalMcqNotification)
        ServerResponse(req, res, 201, null, "Assignment successful");
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
    getAQuestionGroup,
    editQuestionGroup,
    assignNow,
    assignLater
}