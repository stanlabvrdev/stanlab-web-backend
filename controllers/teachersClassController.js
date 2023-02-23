const LabSetup = require("../models/labSetup");
const { Question } = require("../models/question");
const { Teacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { TeacherClass } = require("../models/teacherClass");
const { ServerErrorHandler } = require("../services/response/serverResponse");
const NotFoundError = require("../services/exceptions/not-found");

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
        const classData = await TeacherClass.findOne({
                _id: req.params.classId,
            })
            .populate({
                path: "students",
                select: "name email imageUrl avatar _id isAccepted",
            })
            .select("students, teacher");

        if (!classData) return res.status(404).send({ message: "Class not found" });

        if (classData.teacher.toString() !== req.teacher._id.toString())
            return res.status(401).send({ message: "Not autorized!" });

        res.send(classData);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getAllQuiz(req, res) {
    try {
        const teacherClass = await TeacherClass.findOne({
            _id: req.params.classId,
        }).populate({ path: "classwork.quiz" });

        if (!teacherClass) {
            throw new NotFoundError("class not found");
        }

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

        if (!teacherClass) throw new NotFoundError("Class not found");

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
module.exports = {
    deleteLab,
    deleteQuiz,
    deleteStudentFromClass,
    deleteUnpublishedClass,
    getAllLab,
    getAllQuiz,
    getPublishedClassData,
    getClass,
    getStudents,
};