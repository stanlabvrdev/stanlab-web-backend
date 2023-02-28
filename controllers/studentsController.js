const bcrypt = require("bcryptjs");
const moment = require("moment");
const _ = require("lodash");

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
const Logger = require("../utils/logger");
const CustomError = require("../services/exceptions/custom");
const { doValidate } = require("../services/exceptions/validator");
const { csvUploaderService } = require("../services/csv-uploader");

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

        await teacher.save();
        await student.save();

        res.send({ message: "Invitation sent" });
    } catch (ex) {
        ServerErrorHandler(req, res, ex);
    }
}

async function createStudent(req, res) {
    try {
        doValidate(validateStudent(req.body));
        let { name, email, password, studentClass, teacher } = req.body;

        const teacherEmail = await teacherService.findOne({ email });

        if (teacherEmail) {
            throw new BadRequestError("You cannot use same email registered as  teacher");
        }

        let student = await studentService.findOne({ email });

        if (student) {
            throw new BadRequestError("Email already registered");
        }

        password = await passwordService.hash(password);

        student = await studentService.create({
            name,
            email,
            password,
            studentClass,
            teacher,
        });

        const token = student.generateAuthToken();
        res
            .header("x-auth-token", token)
            .header("access-control-expose-headers", "x-auth-token")
            .send(_.pick(student, ["name", "email", "studentClass", "teacher", "_id"]));
    } catch (err) {
        ServerErrorHandler(req, res, err);
    }
}

async function getStudent(req, res) {
    const { studentId } = req.params;
    try {
        const student = await studentService.getOneAndFilter({ _id: studentId });

        if (student._id.toString() !== studentId) {
            throw new CustomError(403, "Not authorize");
        }

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
                let student = studentService.findOne({ email: studentData.user_name });

                if (!student) {
                    student = await studentService.create({
                        name: getFullName(studentData.first_name, studentData.last_name),
                        userName: studentData.user_name,
                    });

                    await studentTeacherService.create(teacher._id, student._id, teacherClass._id);
                }

                Logger.info(`Created student ${JSON.stringify(student)}`);
            }
        }

        ServerResponse(req, res, 201, null, "successfully uploaded students");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function downloadStudents(req, res) {
    try {
        const teacher = await teacherService.getOne({ email: req.body.email });

        const result = await studentTeacherService.getDownload({ teacher: teacher._id });

        const downloadedUrl = await csvUploaderService.getCsv(result, "students", "student");

        ServerResponse(req, res, 201, downloadedUrl, "successfully downloaded students");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function acceptTeacher(req, res) {
    const teacherId = req.params.teacherId;
    try {
        let student = await studentService.getOne({ _id: req.student._id });
        let teacher = await teacherService.getOne({ _id: teacherId });

        teacher = teacher.acceptStudent(student._id);
        student = student.acceptTeacher(teacherId);

        await teacher.save();
        await student.save();

        const approved = await studentTeacherService.create(teacher._id, student._id);

        ServerResponse(req, res, 200, approved, "Invite accepted");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function deleteTeacher(req, res) {
    const { teacherId } = req.params;
    try {
        let teacher = await teacherService.getOne({ _id: teacherId });
        let student = await studentService.getOne({ _id: req.student._id });
        let updatedStudent = student.removeTeacher(teacherId);
        if (!updatedStudent) return res.status(404).send({ message: "Teacher not found" });

        await updatedStudent.save();

        teacher = teacher.markStudentAsRemoved(student._id);
        await teacher.save();

        ServerResponse(req, res, 200, null, "deleted successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function declineInvite(req, res) {
    try {
        const teacher = await teacherService.getOne({ _id: req.params.teacherId });
        const student = await studentService.getOne({ _id: req.student._id });

        const declined = await studentTeacherService.declineRequest(teacher._id, student._id);

        ServerResponse(req, res, 200, declined, "Invite declined");
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
        if (!student) {
            throw new NotFoundError("Teacher not found");
        }
        res.set("Content-Type", "image/png").send(student.avatar);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getTeachers(req, res) {
    try {
        studentTeacherService.getTeachersByStudentId(req.student._id);
        const teachers = await studentTeacherService.getTeachersByStudentId(req.student._id);

        ServerResponse(req, res, 200, teachers, "teachers fetched successfully");
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
    downloadStudents,
};