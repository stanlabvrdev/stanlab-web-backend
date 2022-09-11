const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");
const { sendInvitation } = require("../../services/email");
const { Student, validateStudent } = require("../../models/student");
const { Teacher } = require("../../models/teacher");
const constants = require("../../utils/constants");
const { LabExperiment } = require("../../models/labAssignment");

async function getClasses(req, res) {
    const studentId = req.student._id;
    try {
        const student = await Student.findOne({ _id: studentId });

        const labs = student.labs;

        const results = [];
        if (labs.length > 0) {
            labs.forEach((lab) => {
                results.push(
                    LabExperiment.findOne({ _id: lab._id })
                    .populate({ path: "experiment", select: ["name", "_id", "subject"] })
                    .populate({ path: "classId", select: ["title", "subject", "section", "_id"], as: "class" })
                );
            });
        }

        const promisified = await Promise.all(results);
        res.send({ messages: "lab successfully fetched", data: promisified });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "something went wrong" });
    }
}

module.exports = {
    getClasses,
};