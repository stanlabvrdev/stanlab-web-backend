//This endpoint handles contracts that involve the MCQs - may later be extended to also handle true/false questions when they are available
const mcqModel = require('../../models/MCQassignment')
const {
    QuestionGroup
} = require('../../models/generated-questions')
const {
    ServerResponse,
    ServerErrorHandler
} = require("../../services/response/serverResponse");

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
        ServerResponse(req, res, 200, questions, "Assignment questions fetched successfully");
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

module.exports = {
    getStudentsUnattemptedMCQ,
    getMCQquestions
}