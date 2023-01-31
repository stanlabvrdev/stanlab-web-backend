const { Teacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { TeacherClass } = require("../models/teacherClass");
const { LabExperiment, validateAssignment, validateGetQuery } = require("../models/labAssignment");
const SystemExperiment = require("../models/systemExperiments");
const { StudentScore } = require("../models/studentScore");
const { createAssignedLabNotification } = require("../services/student/notification");
const { ServerResponse, ServerErrorHandler } = require("../services/response/serverResponse");
const BadRequestError = require("../services/exceptions/bad-request");
const NotFoundError = require("../services/exceptions/not-found");

async function assignLab(req, res) {
    try {
        let { class_id, instruction, start_date, due_date } = req.body;

        const { error } = validateAssignment(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const experimentId = req.params.experimentId;
        const teacher = await Teacher.findOne({ _id: req.teacher._id });

        const experiment = await SystemExperiment.findOne({ _id: experimentId });

        if (!experiment) return res.status(404).send({ message: "experiment not found" });

        //  check class
        let teacherClass = await TeacherClass.findOne({ _id: class_id, teacher: teacher._id });

        if (!teacherClass) {
            throw new NotFoundError("class not found");
        }

        const teacherstudents = teacherClass.students;

        if (teacherstudents.length < 1) {
            throw new NotFoundError("No student found");
        }

        const students = teacherstudents;

        const promises = [];

        for (const studentId of students) {
            const student = await Student.findOne({ _id: studentId });

            let lab = new LabExperiment({
                dueDate: due_date,
                experiment: experimentId,
                startDate: start_date,
                classId: teacherClass._id,
                instruction,
                student: student._id,
                teacher: teacher._id,
            });

            lab = await lab.save();
            let score = new StudentScore({
                classId: teacherClass._id,
                experimentId: lab._id,
                studentId: student._id,
                teacherId: teacher._id,
                score: 0,
            });

            await score.save();

            student.labs.push(lab._id);

            promises.push(student.save());

            promises.push(createAssignedLabNotification(student._id, lab.id, teacher.name || teacher.email));
        }

        await Promise.all(promises);

        ServerResponse(req, res, 201, null, "experiment successfully assigned");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getStudentLabs(req, res) {
    try {
        const student = await Student.findOne({ _id: req.student._id });

        const labs = student.labs;

        let gottenLabs = await LabExperiment.find({
            _id: { $in: labs },
        }).populate({ path: "experiment", select: ["_id", "class", "subject", "instruction", "name"] });

        res.send({ message: "labs successfully fetched", lab: gottenLabs });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error);
    }
}

async function getTeacherAssignedLabs(req, res) {
    try {
        const { error } = validateGetQuery(req.query);
        if (error) {
            throw new BadRequestError(error.details[0].message);
        }
        const filter = {
            teacher: req.teacher._id,
        };

        const is_completed = req.query.is_completed;

        if (is_completed) {
            filter.isCompleted = is_completed == "true" ? true : false;
        }

        let labs = await LabExperiment.find(filter).populate({
            path: "experiment",
            select: ["_id", "class", "subject", "instruction", "name"],
        });

        ServerResponse(req, res, 200, labs, "labs successfully fetched");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function getLabStudents(req, res) {
    try {
        const { experiment_id } = req.query;
        const filter = {
            teacher: req.teacher._id,
        };

        if (experiment_id) {
            filter.experiment = experiment_id;
        }

        let students = await LabExperiment.find(filter)
            .populate({
                path: "student",
                select: ["_id", "email", "name"],
            })
            .select("-instruction -classId -teacher -startDate -dueDate");

        ServerResponse(req, res, 200, students, "students successfully fetched");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = {
    assignLab,
    getStudentLabs,
    getTeacherAssignedLabs,
    getLabStudents,
};