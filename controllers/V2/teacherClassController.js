const LabSetup = require("../../models/labSetup");
const { Question } = require("../../models/question");
const { Teacher } = require("../../models/teacher");
const { Student } = require("../../models/student");
const { TeacherClass } = require("../../models/teacherClass");
const { doInviteStudent } = require("../../services/teacherService");
const { StudentScore } = require("../../models/studentScore");
const { ServerErrorHandler, ServerResponse } = require("../../services/response/serverResponse");
const teacherClassService = require("../../services/teacherClass/teacherClass.service");
const NotAuthorizedError = require("../../services/exceptions/not-authorized");
const studentTeacherClassService = require("../../services/teacherClass/teacher-student-class");
const studentTeacherService = require("../../services/teacherClass/teacher-student");
const NotFoundError = require("../../services/exceptions/not-found");

async function inviteStudent(req, res) {
    const { student_email } = req.body;
    try {
        const teacher = await Teacher.findOne({ _id: req.teacher._id });

        const isTeacher = await Teacher.findOne({ email: student_email });

        if (isTeacher) return res.status(400).send({ message: "eamil exist as teacher" });

        const isStudent = await Student.findOne({ email: student_email });

        const teacherStudents = teacher.students;

        if (isStudent) {
            const isTeacherStudent = teacherStudents.find((data) => data.student == isStudent._id);

            if (isTeacherStudent) {
                return res.status(404).send({ message: "can't add students that are not your student to a class" });
            }
        }

        if (!isStudent) {
            // create student
            // send email notification
        }

        await teacher.save();
        await TeacherClass.deleteOne({ _id: classId });
        res.status(204).send(true);
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(404).send({ message: "Class Not found" });

        ServerErrorHandler(req, res, error);
    }
}

async function deleteUnpublishedClass(req, res) {
    const { classId } = req.params;
    try {
        let teacher = await Teacher.findOne({ _id: req.teacher._id });

        teacher = teacher.deleteClassById(classId);

        await teacher.save();
        await TeacherClass.deleteOne({ _id: classId });
        res.status(204).send(true);
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(404).send({ message: "Class Not found" });

        ServerErrorHandler(req, res, error);
    }
}

async function getStudents(req, res) {
    try {
        const classData = await studentTeacherClassService.getAll({
            class: req.params.classId,
        });

        ServerResponse(req, res, 200, classData, "teachers fetched successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getTeachers(req, res) {
    try {
        const teachers = [];
        const classData = await studentTeacherClassService.getAll({
            class: req.params.classId,
            teacher: req.teacher._id,
        });

        for (let data of classData) {
            teachers.push(data.teacher);
        }

        ServerResponse(req, res, 200, teachers, "teachers fetched successfully");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function addStudentToClass(req, res) {
    const { studentId } = req.body;
    try {
        let teacherClass = await teacherClassService.getOne({
            _id: req.params.classId,
        });

        const studentTeacher = await studentTeacherService.findOne({ teacher: req.teacher._id, student: studentId });

        if (studentTeacher) throw new NotAuthorizedError();

        const added = await studentTeacherClassService.create({
            teacher: req.teacher._id,
            student: studentId,
            class: teacherClass._id,
        });

        ServerResponse(req, res, 201, added, "student added to class successfully");
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(404).send({ message: "Class not found" });
        ServerErrorHandler(req, res, error);
    }
}

async function inviteStudentToClass(req, res) {
    const { studentEmails } = req.body;
    try {
        let result = null;
        if (!studentEmails || studentEmails.length < 1)
            return res.status(400).send({ message: "studentEmails is require and must be atleast 1" });

        let teacherClass = await teacherClassService.getOne({
            _id: req.params.classId,
        });

        for (const studentEmail of studentEmails) {
            let student = await Student.findOne({ email: studentEmail });

            if (!student) {
                req.body.studentEmail = studentEmail;
                req.body.classId = teacherClass._id;
                const data = await doInviteStudent(req, res);

                student = data.student;
            }

            if (student) {
                const exist = student.classes.find((id) => id && id.toString() == teacherClass._id.toString());
                if (!exist) {
                    student.classes.push(teacherClass._id);
                }
                await student.save();
            }

            result = await studentTeacherService.create(req.teacher._id, student._id, teacherClass._id);

            const isStudent = teacherClass.checkStudentById(student._id);
            if (isStudent) {
                ServerResponse(req, res, 200, result, "Student added to class");
            }

            teacherClass = teacherClass.addStudentToClass(student._id);
            await teacherClass.save();
        }

        ServerResponse(req, res, 200, result, "Student added to class");
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getAllQuiz(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        }).populate({ path: "classwork.quiz" });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });

        res.send(teacherClass);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function getAllLab(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });

        res.send(teacherClass.classwork.lab);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function deleteQuiz(req, res) {
    const questionId = req.params.questionId;
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });
        const quiz = teacherClass.classwork.quiz;

        const index = quiz.findIndex((q) => q.toString() === questionId.toString());
        if (index < 0) return res.status(404).send({ message: "Question Not found" });

        quiz.splice(index, 1);
        await Question.deleteOne({ _id: questionId });
        await teacherClass.save();

        res.status(204).send(true);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function deleteLab(req, res) {
    const labId = req.params.labId;
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });
        const lab = teacherClass.deleteLabById(labId);

        if (!lab) return res.status(400).send({ message: "Lab not found" });

        await LabSetup.deleteOne({ _id: labId });
        await teacherClass.save();

        res.status(204).send(true);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getClass(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({ _id: req.params.classId });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        // if (teacherClass.teacher.toString() !== req.teacher._id.toString())
        //     return res.status(401).send({ message: 'Not autorized!' })

        res.send(teacherClass);
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(404).send({ message: "Class Not found" });

        ServerErrorHandler(req, res, error);
    }
}

async function deleteStudentFromClass(req, res) {
    const { classId, studentId } = req.params;

    try {
        let teacherClass = await TeacherClass.findOne({ _id: classId });

        if (!teacherClass) return res.status(404).send({ message: "Class not found" });

        if (teacherClass.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });

        if (!teacherClass.removeStudentFromClass(studentId)) return res.status(404).send({ message: "student not found" });

        teacherClass.removeStudentFromClass(studentId);

        await teacherClass.save();
        res.status(204).send(true);
    } catch (error) {
        if (error.kind === "ObjectId") return res.status(400).send({ message: "Invalid class Id" });
        ServerErrorHandler(req, res, error);
    }
}

async function getPublishedClassData(req, res) {
    const { classId } = req.params;
    if (!classId) return res.status(400).send({ message: "class not found" });

    try {
        const quizs = await TeacherClass.findOne({ _id: classId }).populate({
            path: "sentQuiz sentLab",
            select: "-teacher",
        });
        res.send(quizs);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getScores(req, res) {
    const teacherId = req.teacher._id;
    const classId = req.params.classId;
    const studentId = req.params.studentId;

    try {
        const scores = await StudentScore.find({ teacherId, classId, studentId })
            .populate({
                path: "lab",
                select: ["experiment", "_id"],
                model: "LabExperiment",
                populate: {
                    path: "experiment",
                    model: "SystemExperiment",
                    select: ["testYourKnowlege", "bigQuestion", "subject"],
                },
            })
            .populate({ path: "student_class", select: ["title", "subject", "section", "_id"] });
        // .select("-teacherId -studentId -experimentId -classId");

        res.send({ messages: "scores successfully fetched", data: scores });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
module.exports = {
    addStudentToClass,
    deleteLab,
    deleteQuiz,
    deleteStudentFromClass,
    deleteUnpublishedClass,
    getAllLab,
    getAllQuiz,
    getPublishedClassData,
    getClass,
    getStudents,
    inviteStudentToClass,
    getScores,
    getTeachers,
};