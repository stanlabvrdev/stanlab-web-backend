const { Teacher, validateTeacher, validateUpdateTeacher } = require("../models/teacher");
const { Student } = require("../models/student");

const { LabExperiment } = require("../models/labAssignment");
const SystemExperiment = require("../models/systemExperiments");

async function assignLab(req, res) {
    try {
        const experimentId = req.params.experimentId;
        const teacher = await Teacher.findOne({ _id: req.teacher._id });

        const experiment = await SystemExperiment.findOne({ _id: experimentId });

        if (!experiment) return res.status(404).send({ message: "experiment not found" });

        const students = teacher.students;

        const promises = [];

        if (students.length < 1) return res.status(404).send({ message: "No student found" });

        for (let studentData of students) {
            const studentId = studentData.student;

            const student = await Student.findOne({ _id: studentId });

            let lab = new LabExperiment({
                dueDate: req.body.due_date,
                experiment: experimentId,
                startDate: req.body.start_date,
            });

            lab = await lab.save();
            student.labs.push(lab._id);

            promises.push(student.save());
        }

        await Promise.all(promises);
        res.send({ message: "experiment successfully assigned" });
    } catch (error) {
        res.status(500).send({ message: "Something went wrong" });
        console.log(error.message);
    }
}

module.exports = {
    assignLab,
};