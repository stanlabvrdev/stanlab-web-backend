const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { studentAuth } = require("../middleware/auth");
const { Student, validateStudent, validateIDs } = require("../models/student");
const { Teacher } = require("../models/teacher");
const { TeacherClass } = require("../models/teacherClass");
const { Question } = require("../models/question");
const { studentPassport } = require("../services/initPassport");
const passportAuth = require("../middleware/studentPassportAuth");
const sendInvitation = require("../services/email");

const router = express.Router();

// login via google oauth

router.get(
    "/auth/google",
    studentPassport.authenticate("google", { scope: ["profile", "email"] })
);
router.get("/auth/google/callback", passportAuth);

// Student send invitation to teacher
/*
post: 
*/
router.post("/invite-teacher", studentAuth, async(req, res) => {
    const { teacherEmail } = req.body;
    const { _id } = req.student;
    if (!teacherEmail)
        return res.status(400).send({ message: "teacherEmail is required" });

    try {
        const student = await Student.findOne({ _id });
        const teacher = await Teacher.findOne({ email: teacherEmail });

        if (!teacher) {
            sendInvitation(teacher, student, "student");
            return res.send({
                message: "student not on platform, request has been sent to student email",
            });
        }

        const studentTeacher = teacher.students.find(
            (s) => s._id.toString() === _id.toString()
        );
        if (studentTeacher && !studentTeacher.isAccepted)
            return res
                .status(400)
                .send({ message: "Invite already sent to this teacher" });

        if (
            student.teachers.find((t) => t._id.toString() === teacher._id.toString())
        )
            return res.status(400).send({ message: "teacher already exist" });

        // send mail to student
        // this method may not need to be waited in the future -> decision has to be made here on this
        sendInvitation(teacher, student);

        teacher.students.push(_id);
        await teacher.save();
        student.teachers.push(teacher._id);
        await student.save();
        res.send({ message: "Invitation sent to student" });
    } catch (ex) {
        console.log(ex.message);
        res.status(404).send({ message: "No teacher with this Email found" });
    }
});
/*
Post: Register a new Student
*/

router.post("/", async(req, res) => {
    const { error } = validateStudent(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let { name, email, password, studentClass, teacher } = req.body;
    const teacherEmail = await Teacher.findOne({ email });
    if (teacherEmail)
        return res
            .status(400)
            .send({ message: "You cannot use same email registered as  teacher" });
    let student = await Student.findOne({ email });
    if (student) return res.status(400).send("Email already registered");
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    student = new Student({
        name,
        email,
        password,
        studentClass,
        teacher,
    });
    await student.save();
    const token = student.generateAuthToken();
    res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(_.pick(student, ["name", "email", "studentClass", "teacher"]));
});

// get login  student
router.get("/", studentAuth, async(req, res) => {
    try {
        const student = await Student.findById(req.student._id).select(
            "-password -__v -avatar"
        );

        res.send(student);
    } catch (error) {
        res.status(500).send({ message: "something went wrong" });
    }
});

// student accept teacher request -> through request param(teacherId)
router.post("/accept-invite/:teacherId", studentAuth, async(req, res) => {
    const teacherId = req.params.teacherId;
    try {
        const student = await Student.findOne({ _id: req.student._id });
        const teacher = student.teachers.find(
            (t) => t._id.toString() === teacherId.toString()
        );
        if (!teacher)
            return res.status(404).send({ message: "Teacher does not exist" });
        teacher.isAccepted = true;
        await student.save();
        res.send({ message: "Invite accepted" });
    } catch (error) {
        res.status(500).send({ message: "something went wrong" });
    }
});

// student decline teacher request
router.post("/decline-invite/:teacherId", studentAuth, async(req, res) => {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.teacherId });
        const student = await Student.findOne({ _id: req.student._id });
        if (!teacher)
            return res.status(404).send({ message: "Teacher does not exist" });
        // console.log(teacher);
        let teacherIndex = student.teachers.findIndex((t) => {
            console.log(t);
            return t._id.toString() === req.params.teacherId.toString();
        });

        if (teacherIndex < 0)
            return res.status(404).send({ message: "Teacher does not exist!" });

        const teacherStudent = teacher.students.find((s) => {
            console.log(s);
            return s._id.toString() === req.student._id.toString();
        });
        teacherStudent.status = "declined";
        student.teachers.splice(teacherIndex, 1);
        await student.save();
        await teacher.save();
        res.send({ message: "Teacher declined" });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "student went wrong" });
    }
});

// get student classwork
router.get("/classwork/:classId", studentAuth, async(req, res) => {
    const { classId } = req.params;

    if (!classId)
        return res
            .status(400)
            .send({ message: "Invalid request, teacher classId not found" });
    try {
        let student = await Student.findOne({ _id: req.student._id });
        if (!student) return res.status(404).send({ message: "Student not found" });
        const teacherClass = await TeacherClass.findOne({ _id: classId });
        if (!teacherClass)
            return res.status(404).send({ message: "class not found" });
        const quizs = teacherClass.classwork.quiz;
        if (quizs.length === 0) return res.send(quizs);

        if (
            student.classwork &&
            student.classwork.some((c) => c.classId.toString() === classId.toString())
        ) {
            const getQ = await student
                .populate({ path: "classwork.quizs" })
                .execPopulate();
            return res.send(_.pick(getQ, ["classwork"]));
        }
        async function getQuiz() {
            let classwork = {
                classId: "",
                quizs: [],
                lab: [],
            };
            classwork.classId = classId;
            for (let i = 0; i < quizs.length; i++) {
                const question = await Question.findOne({ _id: quizs[i] });

                if (question.isSend) {
                    classwork.quizs.push(quizs[i]);
                }
            }
            if (classwork.quizs.length === 0)
                return res.send({
                    message: "You don't have active question from this class",
                });
            student.classwork.push(classwork);
            student = await student.save();
            const getQ = await student.populate("classwork.quizs").execPopulate();

            res.send(_.pick(getQ, ["classwork"]));
        }

        await getQuiz();
    } catch (error) {
        console.log(error.message);
        res.status(400).send({ message: "something went wrong" });
    }
});

// get student avatar
router.get("/:id/avatar", async(req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student || !student.avatar)
            return res.status(404).send({ message: "Not Found" });
        res.set("Content-Type", "image/png").send(student.avatar);
    } catch (error) {
        res.status(400).send({ message: "Invalid ID" });
    }
});

module.exports = router;