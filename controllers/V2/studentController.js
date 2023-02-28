const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");

const { Student, validateStudent } = require("../../models/student");
const { Teacher } = require("../../models/teacher");
const { TeacherClass } = require("../../models/teacherClass");
const constants = require("../../utils/constants");
const { LabExperiment } = require("../../models/labAssignment");
const { StudentScore } = require("../../models/studentScore");
const { ServerErrorHandler, ServerResponse } = require("../../services/response/serverResponse");
const studentTeacherClassService = require("../../services/teacherClass/teacher-student-class");

async function getLabs(req, res) {
    const studentId = req.student._id;
    try {
        const student = await Student.findOne({ _id: studentId });

        const labs = student.labs;

        const results = [];
        if (labs.length > 0) {
            for (const lab of labs) {
                const experiment = await LabExperiment.findOne({ _id: lab._id })
                    .populate({ path: "experiment", select: ["name", "_id", "subject", "icon"] })
                    .populate({ path: "classId", select: ["title", "subject", "section", "_id"], alias: "class" });

                if (!experiment || !experiment.classId) {
                    await LabExperiment.deleteOne({ _id: lab._id });
                }

                if (experiment && experiment.classId) {
                    const teacherClass = await TeacherClass.findOne({ _id: experiment.classId._id }).populate({
                        path: "teacher",
                        select: ["name", "email", "_id"],
                    });
                    experiment.teacher = teacherClass.teacher;
                    experiment.class = experiment.classId;
                    delete experiment.classId;

                    // experiment.set("teacher", teacherClass.teacher);

                    results.push(experiment);
                }
            }
        }

        // const promisified = await Promise.all(results);
        res.send({ messages: "lab successfully fetched", data: results });
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