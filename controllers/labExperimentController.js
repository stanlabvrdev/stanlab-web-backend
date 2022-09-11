const { Teacher, validateTeacher, validateUpdateTeacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { TeacherClass } = require("../models/teacherClass");
const { LabExperiment, validateAssignment } = require("../models/labAssignment");
const SystemExperiment = require("../models/systemExperiments");

async function assignLab(req, res) {
    try {
        let { students, class_id, instruction, start_date, due_date } = req.body;

        const { error } = validateAssignment(req.body);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const experimentId = req.params.experimentId;
        const teacher = await Teacher.findOne({ _id: req.teacher._id });

        const experiment = await SystemExperiment.findOne({ _id: experimentId });

        if (!experiment) return res.status(404).send({ message: "experiment not found" });

        //  check class
        let teacherClass;
        if (class_id) {
            teacherClass = await TeacherClass.findOne({ _id: class_id });
        }

        if (!class_id) {
            teacherClass = new TeacherClass({
                title: "default",
                teacher: req.teacher._id,
            });
            await teacherClass.save();
        }

        if (!teacherClass) return res.status(404).send({ message: "class not found" });

        const teacherstudents = teacher.students;

        if (teacherstudents.length < 1) return res.status(404).send({ message: "No student found" });

        students = teacherstudents.filter((s) => students.includes(s.student.toString()));

        const promises = [];

        for (let studentData of students) {
            const studentId = studentData.student;

            const student = await Student.findOne({ _id: studentId });

            let lab = new LabExperiment({
                dueDate: due_date,
                experiment: experimentId,
                startDate: start_date,
                classId: teacherClass._id,
                instruction,
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