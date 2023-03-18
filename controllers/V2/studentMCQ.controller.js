//This endpoint handles contracts that involve the MCQs - may later be extended to also handle true/false questions when they are available

const studentMCQ = require('../../models/studentMCQ')
const {
    ServerResponse,
    ServerErrorHandler
} = require("../../services/response/serverResponse");
const NotFoundError = require('../../services/exceptions/not-found')
const BadRequestError = require('../../services/exceptions/bad-request');


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

async function getAssignments(req, res) {
    try {
        const currentDate = Date.now();
        const assignments = await studentMCQ.find({
            student: req.student._id
        }).select('-__v').lean();

        const formattedAssignments = assignments.reduce((acc, assignment) => {
            if (assignment.type === 'Practice' && currentDate > assignment.dueDate) {
                acc.pending.push(assignment);
            } else if (assignment.type === 'Practice' && assignment.scores.length > 0) {
                acc.submitted.push(assignment);
            } else if (assignment.type === 'Practice' && assignment.scores.length === 0) {
                acc.expired.push(assignment);
            } else if (assignment.type === 'Test' && assignment.scores.length > 0) {
                acc.submitted.push(assignment);
            } else if (assignment.type === 'Test' && currentDate >= assignment.dueDate) {
                acc.expired.push(assignment);
            } else if (assignment.type === 'Test' && currentDate < assignment.dueDate) {
                acc.pending.push(assignment);
            }
            return acc;
        }, {
            pending: [],
            submitted: [],
            expired: []
        });
        ServerResponse(req, res, 200, formattedAssignments, "Topical assignments fetched");
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}


//To get the question for a particular assignment
async function getAssignment(req, res) {
    try {
        const assignment = await studentMCQ.findOne({
            _id: req.params.id,
            student: req.student._id
        }).populate(populateOptions).select('-__v').lean()
        if (!assignment) throw new NotFoundError('Assignment not found')
        ServerResponse(req, res, 200, assignment, "Assignment fetched successfully");
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

//To submit an assignment
async function makeSubmission(req, res) {
    try {
        const {
            score
        } = req.body
        const assignment = await studentMCQ.findOne({
            student: req.student._id,
            _id: req.params.id
        })
        if (!assignment) throw new NotFoundError('Assigment not found')
        if (Date.now() > assignment.dueDate) throw new BadRequestError('Assignment expired, cannot make a submission')
        if (assignment.type === 'Practice') {
            assignment.scores.push({
                score
            })
        } else if (assignment.type === 'Test') {
            if (assignment.scores.length > 0) throw new BadRequestError('Already submitted')
            assignment.scores.push({
                score
            })
        }
        await assignment.save()
        ServerResponse(req, res, 200, assignment, 'Score saved successfully')
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

module.exports = {
    getAssignments,
    getAssignment,
    makeSubmission
}