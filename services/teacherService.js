const sharp = require("sharp");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const generator = require("generate-password");

const { Teacher, validateTeacher, validateUpdateTeacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { TeacherClass, validateClass } = require("../models/teacherClass");
const QuizClasswork = require("../models/quizClasswork");
const Experiment = require("../models/experiment");
const { sendInvitation, doSendInvitationEmail } = require("../services/email");
const { LabExperiment } = require("../models/labAssignment");
const SystemExperiment = require("../models/labAssignment");

async function doInviteStudent(req, res) {
    // const { studentEmail, classId } = req.body
    const { studentEmail } = req.body;
    const { _id } = req.teacher;

    let teacher = await Teacher.findOne({ _id });
    let student = await Student.findOne({ email: studentEmail });

    // save student in class

    /**
     * Tasks => student should be added from the list of teacher students
     * invite student from a class should be from pool of students
     */
    if (teacher.email === studentEmail) return res.status(400).send({ message: "You can't send invite to yourself" });

    if (!student) {
        // teacher = teacher.addUnregisterStudent(studentEmail);
        let generatedPassword = generator.generate({
            length: 5,
            numbers: true,
        });
        const salt = await bcrypt.genSalt(10);
        let password = await bcrypt.hash(generatedPassword, salt);

        const createdStudent = new Student({
            email: studentEmail,
            password,
            name: "new student",
        });

        await createdStudent.save();

        // create student

        doSendInvitationEmail(createdStudent, teacher, generatedPassword);

        student = createdStudent;
    }

    const isStudent = teacher.checkStudentById(student._id);
    if (isStudent) return res.status(400).send({ message: "Invitation already sent to this student" });

    // add student to class

    // add student to teacher list of students
    teacher = teacher.addStudent(student._id);

    // add teacher to student list
    student = student.addTeacher(teacher._id, "teacher");

    sendInvitation(teacher, student, "teacher");

    await teacher.save();
    await student.save();

    return { teacher, student };
}

module.exports = {
    doInviteStudent,
};