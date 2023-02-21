const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");
const { sendInvitation } = require("../services/email");
const { Student, validateStudent } = require("../models/student");
const { Teacher } = require("../models/teacher");
const constants = require("../utils/constants");
const { ServerErrorHandler, ServerResponse } = require("../services/response/serverResponse");
const { excelParserService } = require("../services/excelParserService");
const { passwordService } = require("../services/passwordService");
const BadRequestError = require("../services/exceptions/bad-request");
const { generateUserName, getFullName } = require("../services/student/generator");
const NotFoundError = require("../services/exceptions/not-found");
const { TeacherClass } = require("../models/teacherClass");
const generateRandomString = require("../utils/randomStr");
const { StudentTeacher } = require("../models/teacherStudent");
const studentTeacherService = require("../services/teacherClass/teacher-student");
const studentService = require("../services/student/student.service");
const teacherService = require("../services/teacher/teacher.service");
const teacherClassService = require("../services/teacherClass/teacherClass.service");

async function inviteTeacher(req, res) {
    let { teacherEmail } = req.body;
    const { _id } = req.student;
    if (!teacherEmail) return res.status(400).send({ message: "teacherEmail is required" });

    try {
        let student = await Student.findOne({ _id });
        let teacher = await Teacher.findOne({ email: teacherEmail });

        if (!teacher) {
            let isStudent = student.addUnregisterTeacher(teacherEmail);
            if (!isStudent) return res.status(400).send({ message: "Invite already sent" });
            sendInvitation({ email: teacherEmail, name: "" }, student, "student");
            await student.save();
            return res.send({
                message: "Teacher not on platform, request has been sent to Teacher email",
            });
        }

        if (student.checkTeacherById(teacher._id))
            return res.status(400).send({ message: "Invite already sent to this teacher" });

        student = student.addTeacher(teacher._id);

        teacher = teacher.addStudent(student._id, "student");

        // send mail to student
        // this method may not need to be waited in the future -> decision has to be made here on this
        sendInvitation(teacher, student, "student");

        await teacher.save();
        await student.save();

        res.send({ message: "Invitation sent" });
    } catch (ex) {
        ServerErrorHandler(req, res, ex);
    }
}

async function createStudent(req, res) {
    const { error } = validateStudent(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let { name, email, password, studentClass, teacher } = req.body;
    const teacherEmail = await Teacher.findOne({ email });
    if (teacherEmail) return res.status(400).send({ message: "You cannot use same email registered as  teacher" });

    let student = await Student.findOne({ email });

    if (student) return res.status(400).send("Email already registered");

    password = await passwordService.hash(password);

    student = new Student({
        name,
        email,
        password,
        studentClass,
        teacher,
    });

    // student[constants.trialPeriod.title] = moment().add(constants.trialPeriod.days, "days");
    await student.save();
    const token = student.generateAuthToken();
    res
        .header("x-auth-token", token)
        .header("access-control-expose-headers", "x-auth-token")
        .send(_.pick(student, ["name", "email", "studentClass", "teacher", "_id"]));
}

async function getStudent(req, res) {
    const { studentId } = req.params;
    try {
        const student = await Student.findOne({ _id: studentId }).select("-password -__v -avatar");

        if (!student) return res.status(404).send({ message: "Student not found" });
        if (student._id.toString() !== studentId) return res.status(403).send({ message: "Not authorize" });

        res.send(student);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function bulkCreate(req, res) {
    try {
        const data = await excelParserService.convertToJSON(req);
        const promises = [];
        for (let item of data) {
            const studentExist = await Student.findOne({ email: item.Email });

            if (studentExist) throw new BadRequestError(`student ${item.Email} already exist`);

            const student = new Student({
                name: `${item["First Name"]} ${item["Last Name"]}`,
                email: item.Email,
                password: await passwordService.hash(item.Password),
            });

            promises.push(student.save());
        }
        const response = await Promise.all(promises);

        ServerResponse(req, res, 201, null, "successfully uploaded students");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function bulkSignup(req, res) {
    try {
        const data = await excelParserService.convertToJSON(req);

        const studentLastIndex = data.findIndex((data) => data.Firstname.toLowerCase() == "teachers");
        const onlyStudents = data.slice(0, studentLastIndex).map((item) => ({
            first_name: item.Firstname,
            last_name: item.Surname,
        }));
        const onlyTeachers = data.slice(studentLastIndex + 2).map((item) => ({
            first_name: item.Firstname,
            last_name: item.Surname,
            email: item.__EMPTY,
            subject: item.__EMPTY_1,
        }));

        for (let stud of onlyStudents) {
            stud.user_name = await generateUserName(stud.first_name, stud.last_name);
        }
        for (let teacherData of onlyTeachers) {
            // const teacher = await Teacher.findOne({ email: teacherData.email });
            const teacher = await teacherService.getOne({ email: teacherData.email });

            let teacherClass = await TeacherClass.findOne({ subject: teacherData.subject });

            if (!teacherClass) {
                teacherClass = await teacherClassService.create({
                    subject: teacherData.subject,
                    name: teacherData.subject,
                    title: teacherData.subject,
                });
            }

            teacherData.classId = teacherClass._id;
            teacherData.teacherId = teacher._id;

            for (const studentData of onlyStudents) {
                const student = await studentService.create({
                    name: getFullName(studentData.first_name, studentData.last_name),
                    userName: studentData.user_name,
                });

                await studentTeacherService.create(teacher._id, student._id, teacherClass._id);
            }
        }

        ServerResponse(req, res, 201, null, "successfully uploaded students");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function acceptTeacher(req, res) {
    const teacherId = req.params.teacherId;
    try {
        let student = await Student.findOne({ _id: req.student._id });
        let teacher = await Teacher.findOne({ _id: teacherId });

        teacher = teacher.acceptStudent(student._id);
        student = student.acceptTeacher(teacherId);

        await teacher.save();
        await student.save();
        res.send({ message: "Invite accepted" });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function deleteTeacher(req, res) {
    const { teacherId } = req.params;
    try {
        let teacher = await Teacher.findOne({ _id: teacherId });
        let student = await Student.findOne({ _id: req.student._id });
        let updatedStudent = student.removeTeacher(teacherId);
        if (!updatedStudent) return res.status(404).send({ message: "Teacher not found" });

        await updatedStudent.save();
        if (!teacher) return res.status(400).send({ message: "Something is wrong" });

        teacher = teacher.markStudentAsRemoved(student._id);
        await teacher.save();
        res.status(204).send(true);
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(404).send({ message: "Teacher not found" });
        ServerErrorHandler(req, res, error);
    }
}

async function declineInvite(req, res) {
    try {
        const teacher = await Teacher.findOne({ _id: req.params.teacherId });
        const student = await Student.findOne({ _id: req.student._id });
        if (!teacher) return res.status(404).send({ message: "Teacher does not exist" });

        let teacherIndex = student.teachers.findIndex((t) => {
            return t._id.toString() === req.params.teacherId.toString();
        });

        if (teacherIndex < 0) return res.status(404).send({ message: "Teacher does not exist!" });

        const teacherStudent = teacher.students.find((s) => {
            return s._id.toString() === req.student._id.toString();
        });
        teacherStudent.status = "declined";
        student.teachers.splice(teacherIndex, 1);
        await student.save();
        await teacher.save();
        res.send({ message: " declined" });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getLabClasswork(req, res) {
    try {
        // .sentQuizId
        const labClass = await Student.findOne({ _id: req.student._id })
            .populate({ path: "classworks.labClasswork.sentLab" })
            // .lean()
            // .exec()
            .select("classworks.labClasswork");

        res.send(labClass);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function getClasswork(req, res) {
    try {
        // .sentQuizId
        const classworks = await Student.findOne({ _id: req.student._id })
            .populate({
                path: "classworks.quizClasswork.sentQuizId  classworks.labClasswork.sentLab",
            })
            // .lean()
            // .exec()
            .select("classworks");

        res.send(classworks);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getAvatar(req, res) {
    try {
        const student = await Student.findById(req.params.id);
        if (!student || !student.avatar) return res.status(404).send({ message: "Not Found" });
        res.set("Content-Type", "image/png").send(student.avatar);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getTeachers(req, res) {
    try {
        const teachers = await Student.findOne({ _id: req.student._id })
            .populate({
                path: "teachers.teacher",
                select: "name email imageUrl avatar _id isAccepted",
            })
            .select("teachers");
        res.send(teachers);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function postFinishedQuiz(req, res) {
    // mark sentQuiz as completed => set it to true
    // create new Instance of finishedQuiz
    const { _id } = req.student;
    const { sentQuizId, totalPoints, answersSummary, scores } = req.body;
    if (!sentQuizId || !totalPoints || !answersSummary)
        return res.status(400).send({ message: "Please provide valid data" });

    try {
        let student = await Student.findOne({ _id });
        const quizId = student.addCompletQuiz(sentQuizId, totalPoints, answersSummary, scores);
        await student.save();
        res.send(quizId);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getFinishedQuiz(req, res) {
    const { _id } = req.student;
    const { quizId } = req.params;

    try {
        let student = await Student.findOne({
            _id,
            // 'classworks.quizClasswork': { $elemMatch: { _id: quizId } },
        }).populate("classworks.quizClasswork.answersSummary.questionId");

        const quiz = student.getCompletedQuizById(quizId);
        if (!quiz) return res.status(400).send({ message: "invalid quiz" });

        res.send(quiz);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = {
    acceptTeacher,
    createStudent,
    declineInvite,
    deleteTeacher,
    getAvatar,
    getLabClasswork,
    getClasswork,
    getStudent,
    getTeachers,
    inviteTeacher,
    postFinishedQuiz,
    getFinishedQuiz,
    bulkCreate,
    bulkSignup,
};