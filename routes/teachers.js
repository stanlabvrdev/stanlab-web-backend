const express = require("express");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const multer = require("multer");
const _ = require("lodash");
// const passport = require("passport");

const { teacherPassport } = require("../services/initPassport");

const {
    Teacher,
    validateTeacher,
    validateUpdateTeacher,
} = require("../models/teacher");
const { Student, validateIDs } = require("../models/student");
const { teacherAuth } = require("../middleware/auth");
const { Question } = require("../models/question");
const sendInvitation = require("../services/email");
const { validateClass, TeacherClass } = require("../models/teacherClass");
const router = express.Router();

// login via google oauth

router.get(
    "/auth/google",
    teacherPassport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
    "/auth/google/callback",
    teacherPassport.authenticate("google", {
        session: false,
    }),
    (req, res) => {
        // login teacher here
        // console.log("teacher =", req.teacher, "user =", req.user);
        const token = req.user.generateAuthToken();
        res.send(token);
    }
);

// teacher create class
/*
body => title, subject, section
*/
router.post("/create-class", teacherAuth, async(req, res) => {
    const { title, subject, section } = req.body;
    const { error } = validateClass(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const teacher = await Teacher.findOne({ _id: req.teacher._id });
        let teacherClass = new TeacherClass({ title, subject, section });
        teacherClass = await teacherClass.save();
        teacher.classes.push(teacherClass._id);
        await teacher.save();
        res.send({ message: "class created" });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "error creating" });
    }
});

// teacher create Quiz

// {
//     questions: [{
//         question: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "Question",
//         },
//         point: { type: Number, required: true },
//         dueDate: { type: Date },
//         sendDate: { type: Date, default: Date.now() },
//     }, ],
// }, ],
// }
// teacher class id as parameter
router.post(
    "/create-class/:classId/create-quiz",
    teacherAuth,
    async(req, res) => {
        // points, dueDate-> date, sendDate,
        const { points, dueDate, sendDate } = req.body;

        const { classId } = req.params;
        // teacher class
        const teacher = await Teacher.findOne({ _id: req.teacher._id });
        const teacherClass = teacher.classes.find(
            (c) => c._id.toString() === classId.toString()
        );
        if (!teacherClass)
            return res.status(404).send({ message: "Invalid classID" });
        const question = {
            question,
        };
        teacherClass.questions.push(question);
    }
);

// post: Teacher avatar

const upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Please upload valid image"));
        }
        cb(null, true);
    },
});

router.post(
    "/avatar",
    teacherAuth,
    upload.single("avatar"),
    async(req, res) => {
        try {
            const teacher = await Teacher.findById(req.teacher._id);
            teacher.avatar = await sharp(req.file.buffer)
                .resize({ width: 180, height: 180 })
                .png()
                .toBuffer();
            await teacher.save();
            res.send({ message: "successful" });
        } catch (error) {
            res.status(400).send({ message: "Invalid ID" });
        }
    },
    (error, req, res, next) => {
        res.status(400).send({ error: error.message });
    }
);

// get teacher avatar
router.get("/:id/avatar", async(req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher || !teacher.avatar)
            return res.status(404).send({ message: "Not Found" });
        res.set("Content-Type", "image/png").send(teacher.avatar);
    } catch (error) {
        res.status(400).send({ message: "Invalid ID" });
    }
});

// create a teacher
router.post("/", async(req, res) => {
    const { error } = validateTeacher(req.body);
    let { name, email, password } = req.body;
    if (error) return res.status(400).send(error.details[0].message);
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    let teacher = await Teacher.findOne({ email });
    if (teacher)
        return res.status(400).send({ message: "Email already Registered" });
    teacher = new Teacher({
        name,
        password,
        email,
    });

    await teacher.save();
    const token = teacher.generateAuthToken();
    res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(_.pick(teacher, ["name", "email", "questions", "students"]));
});

// update a teacher via email and name
router.put("/", teacherAuth, async(req, res) => {
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        if (!teacher)
            return res.status(404).send({ message: "teacher was not found" });

        const { email, name } = req.body;
        const { error } = validateUpdateTeacher(req.body);

        if (error) return res.status(400).send(error.details[0].message);
        teacher.name = name;
        teacher.email = email;
        await teacher.save();
        res.send(teacher);
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Something went wrong");
    }
});

// Send questions to all students
router.post("/students/questions", teacherAuth, async(req, res) => {
    // array of questions
    try {
        const teacher = await Teacher.findById(req.teacher._id)
            .populate("students", "-avatar")
            .select("-avatar");

        const questions = teacher.questions;

        if (teacher.students.length === 0)
            return res.status(400).send({ message: "You don't have any students" });

        for (let i = 0; i < teacher.students.length; i++) {
            const studentsId = teacher.students[i]._id;
            const student = await Student.findById(studentsId);
            student.questions = questions;
            await student.save();
        }
        // send to teacher archives
        teacher.archivedQuestions = questions;
        teacher.questions = null;
        await teacher.save();
        res.send({ message: "Questions sent!" });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Something went wrong" });
    }
});
/*
 */

// add student to list find the student, set isaccepted to true

router.get("/students", teacherAuth, async(req, res) => {
    try {
        const students = await Teacher.find({ _id: req.teacher._id })
            .populate("students", "-__v -password")
            .select("students");
        if (!students) return res.send([]);
        return res.send(students);
    } catch (error) {
        console.log(error.message);
    }
});

// delete student
router.delete("/students/:id", teacherAuth, async(req, res) => {
    const studentID = req.params.id;
    try {
        const teacher = await Teacher.findById(req.teacher._id);
        const indx = teacher.students.findIndex(
            (s) => s._id.toString() === studentID.toString()
        );
        if (indx === -1)
            return res
                .status(404)
                .send({ message: "Student with this ID was not found" });

        const student = await Student.findById(studentID);
        student.teacher = null;
        student.isAccepted = false;
        teacher.students.splice(indx, 1);
        await student.save();
        await teacher.save();

        res.send({ message: "Student Deleted" });
        // const removedStudent = await Teacher.update(
        //   { _id: req.teacher._id },
        //   { $pull: { students: studentID } }
        // );
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ message: "Something went wrong!" });
    }
});
// get teacher questions
router.get("/questions", teacherAuth, async(req, res) => {
    const { subject } = req.query;

    if (!subject) return res.status(400).send({ message: "Invalid URL" });
    const questions = await Teacher.find({
            _id: req.teacher._id,
        })
        .populate({ path: "questions", match: { subject, isPublished: false } })
        .select("questions");
    return res.send(questions);
});

// delete a question
router.delete("/questions/:id", teacherAuth, async(req, res) => {
    const questionID = req.params.id;
    const teacherID = req.teacher._id;
    const teacher = await Teacher.findById(teacherID);
    try {
        const question = await Question.findByIdAndRemove(questionID);
        if (!question)
            return res
                .status(404)
                .send({ message: "Question with this ID was not found" });
        const quesIndex = teacher.questions.findIndex(
            (q) => q.toString() === questionID.toString()
        );
        if (!quesIndex)
            return res
                .status(404)
                .send({ message: "Question with this ID was not found" });
        teacher.questions.splice(quesIndex, 1);
        await teacher.save();
        res.send({ message: "Question successfully deleted" });
    } catch (error) {
        console.log(error.message);
        res.status(400).send({ message: "Invalid Question ID" });
    }
});

// Teacher add student
router.post("/add-student", teacherAuth, async(req, res) => {
    const { studentID } = req.body;
    try {
        const student = await Student.findById(studentID);
        if (!student) return res.status(404).send({ message: "Student not found" });
        student.isAccepted = true;
        student.teacher = req.teacher._id;

        await student.save();
        res.send({ message: "student added" });
    } catch (error) {
        console.log(error.message);
        return res.status(400).send({ message: "Invalid student ID" });
    }
});

// Teacher Invite student to join class using the student  email
// the request body should contain the email of a student
router.post("/invite-student", teacherAuth, async(req, res) => {
    const { studentEmail } = req.body;
    const { _id } = req.teacher;

    try {
        const teacher = await Teacher.findOne({ _id });
        const student = await Student.findOne({ email: studentEmail });

        if (!student)
            return res.status(404).send({ message: "Student not Registered" });

        const studentTeacher = student.teachers.find(
            (teacher) => teacher._id.toString() === _id.toString()
        );
        if (studentTeacher && !studentTeacher.isAccepted)
            return res
                .status(400)
                .send({ message: "Invite already sent to this student" });

        if (
            teacher.students.find((s) => s._id.toString() === student._id.toString())
        )
            return res.status(400).send({ message: "student already exist" });

        // send mail to student
        // this method may not need to be waited in the future -> decision has to be made here on this
        sendInvitation(teacher, student, "teacher");

        teacher.students.push(student._id);
        await teacher.save();
        student.teachers.push(_id);
        await student.save();
        res.send({ message: "Invitation sent to student" });
    } catch (ex) {
        console.log(ex.message);
        res.status(500).send({ message: "Something went wrong" });
    }
});

// get a teacher
router.get("/:id", async(req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id).select(
            "-password -avatar"
        );
        if (!teacher)
            return res
                .status(404)
                .send({ message: "Teacher with this ID was not found" });
        res.send(teacher);
    } catch (error) {
        console.log(error.message);
        res.status(400).send({ message: "Invalid teacher ID" });
    }
});
// Get: all students
module.exports = router;