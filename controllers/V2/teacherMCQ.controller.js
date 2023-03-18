const studentMCQ = require('../../models/studentMCQ')
const teacherMCQ = require('../../models/teacherMCQ')
const {
    ServerResponse,
    ServerErrorHandler
} = require("../../services/response/serverResponse");
const NotFoundError = require('../../services/exceptions/not-found')
const BadRequestError = require('../../services/exceptions/bad-request');

function updateUtility(assignment, updates) {
    assignment.startDate = updates.startDate
    assignment.dueDate = updates.dueDate
    assignment.instruction = updates.instruction
    assignment.type = updates.type
}
async function getAssignmentsByClass(req, res) {
    try {} catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function getAssignment(req, res) {
    try {} catch (err) {
        ServerErrorHandler(req, res, err)
    }
}

async function editAssignment(req, res) {
    try {
        const {
            id
        } = req.params
        const assignment = await teacherMCQ.findOne({
            teacher: req.teacher._id,
            _id: id
        })
        if (!assignment) throw new NotFoundError('Assignment not found')
        const studentAssignments = await studentMCQ.find({
            teacherAssignment: assignment._id
        })
        const savePromises = studentAssignments.map((eachAssignment) => {
            updateUtility(eachAssignment, req.body)
            return eachAssignment.save()
        })
        updateUtility(assignment, req.body)
        savePromises.push(assignment.save())
        await Promise.all(savePromises)
        ServerResponse(req, res, 200, assignment, 'Assignment updated successfully')
    } catch (err) {
        console.log(err)
        ServerErrorHandler(req, res, err)
    }
}

async function deleteAssignment(req, res) {
    try {
        const {
            id
        } = req.params
        const assignment = await teacherMCQ.findOne({
            teacher: req.teacher._id,
            _id: id
        })
        if (!assignment) throw new NotFoundError('Assignment not found')
        const studentAssigments = await studentMCQ.find({
            teacherAssignment: assignment._id
        })
        const deletePromises = studentAssigments.map(eachAssignment => eachAssignment.deleteOne())
        deletePromises.push(assignment.deleteOne())
        await Promise.all(deletePromises)
        ServerResponse(req, res, 200, null, 'Assignment Deleted successfully')
    } catch (err) {
        console.log(err)
        ServerErrorHandler(req, res, err)
    }
}

module.exports = {
    getAssignment,
    getAssignmentsByClass,
    editAssignment,
    deleteAssignment
}

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2ZmNjgwMjdhZjEzNzE0MDg4NmQ0NzkiLCJyb2xlIjoiVGVhY2hlciIsImlhdCI6MTY3OTE0NzQyOX0.urX9W7egLoLTBtfUdzr8Fni_iDjYeWmY3ttv6-hczP4