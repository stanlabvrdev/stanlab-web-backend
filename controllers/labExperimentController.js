const { Teacher, validateTeacher, validateUpdateTeacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { TeacherClass } = require("../models/teacherClass");
const { LabExperiment, validateAssignment } = require("../models/labAssignment");
const SystemExperiment = require("../models/systemExperiments");
const { StudentScore } = require("../models/studentScore");

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

        if (!teacherClass) return res.status(404).send({ message: "class not found" });

        const teacherstudents = teacherClass.students;

        if (teacherstudents.length < 1) return res.status(404).send({ message: "No student found" });

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
        }

        await Promise.all(promises);
        res.send({ message: "experiment successfully assigned" });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error);
    }
}

async function getStudentLabs(req, res) {
    try {
        const student = await Student.findOne({ _id: req.student._id });

        const labs = student.labs;

        let gottenLabs = await LabExperiment.find({
            _id: { $in: labs },
        }).populate({ path: "experiment", select: ["_id", "class", "subject", "instruction"] });

        res.send({ message: "labs successfully fetched", lab: gottenLabs });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error);
    }
}

module.exports = {
    assignLab,
    getStudentLabs,
};