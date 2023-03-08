//This endpoint handles contracts that involve the MCQs - may later be extended to also handle true/false questions when they are available
const mcqModel = require('../../models/MCQassignment')
const {
    ServerResponse,
    ServerErrorHandler
} = require("../../services/response/serverResponse");
const NotFoundError = require('../../services/exceptions/not-found')

const populateOptions = {
    path: 'questions',
    populate: {
        path: 'questions',
        select: '-__v',
        options: {
            lean: true
        }
    }
}

async function getStudentsUnattemptedMCQ(req, res) {
    try {
        const unattemptedAssignments = await mcqModel.find({
            student: req.student._id,
            isCompleted: false
        }).select('-__v').lean()
        ServerResponse(req, res, 200, unattemptedAssignments, "Topical assignments fetched");
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

async function getMCQquestions(req, res) {
    try {
        const questions = await mcqModel.findOne({
            _id: req.params.id
        }).populate(populateOptions).select('-__v').lean()
        if (!questions) throw new NotFoundError('Questions not found')
        ServerResponse(req, res, 200, questions, "Assignment questions fetched successfully");
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

async function submitAssignment(req, res) {
    try {
        const assignment = await mcqModel.findOne({
            student: req.student._id,
            _id: req.body.assignmentID
        })
        if (!assignment) throw new NotFoundError('Assigment not found')
        assignment.scores.push({
            score: req.body.score
        })
        await assignment.save()
        ServerResponse(req, res, 200, assignment, 'Score saved successfully')
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

module.exports = {
    getStudentsUnattemptedMCQ,
    getMCQquestions,
    submitAssignment
}