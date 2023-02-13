const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");
const { sendInvitation } = require("../../services/email");
const { Student, validateStudent } = require("../../models/student");
const { Teacher } = require("../../models/teacher");
const { TeacherClass } = require("../../models/teacherClass");
const constants = require("../../utils/constants");
const { LabExperiment } = require("../../models/labAssignment");
const { StudentScore } = require("../../models/studentScore");
const { ServerErrorHandler } = require("../../services/response/serverResponse");

async function getLabs(req, res) {
    const studentId = req.student._id;
    try {
        const student = await Student.findOne({ _id: studentId });

        const labs = student.labs;

        const results = [];
        if (labs.length > 0) {
            for (const lab of labs) {
                const experiment = await LabExperiment.findOne({ _id: lab._id })
                    .populate({ path: "experiment", select: ["name", "_id", "subject"] })
                    .populate({ path: "classId", select: ["title", "subject", "section", "_id"], alias: "class" })
                    .lean();

                const teacherClass = await TeacherClass.findOne({ _id: experiment.classId._id }).populate({
                    path: "teacher",
                    select: ["name", "email", "_id"],
                });
                experiment.teacher = teacherClass.teacher;
                experiment.class = experiment.classId;
                delete experiment.classId;
                // experiment.set("teacher", teacherClass.teacher);
                console.log(teacherClass);
                results.push(experiment);
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
        const student = await Student.findOne({ _id: studentId })
            .populate({
                path: "classes",
                select: ["_id", "title", "subject", "section", "teacher"],
            })
            .lean();

        const classes = student.classes;

        for (const clas of classes) {
            const teacher = await Teacher.findOne({ _id: clas.teacher }).lean();

            clas.teacher = _.pick(teacher, ["name", "email", "_id"]);
        }

        // const promisified = await Promise.all(results);
        res.send({ messages: "classes successfully fetched", data: classes });
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

        console.log(scores);
        res.send({ messages: "scores successfully fetched", data: scores });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = {
    getLabs,
    getClasses,
    getScores,
};