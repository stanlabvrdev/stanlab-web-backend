const { StudentScore } = require("../../models/studentScore");
const { ServerErrorHandler, ServerResponse } = require("../../services/response/serverResponse");
const studentTeacherClassService = require("../../services/teacherClass/teacher-student-class");
const studentLabExperimentService = require("../../services/labExperiment/student-lab-experiment.service");

async function getLabs(req, res) {
    try {
        const experiments = await studentLabExperimentService.getAll(req);

        ServerResponse(req, res, 200, experiments, "lab successfully fetched");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getClasses(req, res) {
    const studentId = req.student._id;
    try {
        const classes = await studentTeacherClassService.getAll({ student: studentId });
        // const promisified = await Promise.all(results);
        ServerResponse(req, res, 200, classes, "classes successfully fetched");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getTeachers(req, res) {
    try {
        const teachers = [];
        const classData = await studentTeacherClassService.getAll({
            class: req.params.classId,
            student: req.student._id,
        });

        for (let data of classData) {
            teachers.push(data.teacher);
        }

        ServerResponse(req, res, 200, teachers, "teachers fetched successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getScores(req, res) {
    const studentId = req.student._id;
    const { classId } = req.params;
    try {
        const scores = await StudentScore.find({ studentId: studentId, classId: classId })
            .populate({ path: "student", select: ["name", "_id", "email"], model: "Student" })
            .populate({ path: "student_class", select: ["title", "subject", "section", "_id"] });

        res.send({ messages: "scores successfully fetched", data: scores });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = {
    getLabs,
    getClasses,
    getScores,
    getTeachers,
};