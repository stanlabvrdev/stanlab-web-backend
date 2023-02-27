const { StudentTeacher } = require("../../models/teacherStudent");
const { StudentTeacherClass } = require("../../models/teacherStudentClass");
const NotFoundError = require("../exceptions/not-found");

class StudentTeacherService {
    async create(teacherId, studentId, classId) {
        const exist = await StudentTeacher.findOne({ student: studentId, teacher: teacherId });

        if (exist) {
            // approve

            exist.studentApproved = true;

            await exist.save();

            return exist;
        }

        if (classId) {
            const studentClass = new StudentTeacherClass({
                teacher: teacherId,
                student: studentId,
                class: classId,
            });

            await studentClass.save();
        }
        const newStudentTeacher = new StudentTeacher({
            teacher: teacherId,
            student: studentId,
        });

        return newStudentTeacher.save();
    }

    async getAll(conditions) {
        return StudentTeacher.find(conditions).populate("student").populate("teacher");
    }
    async getDownload(conditions) {
        const data = await StudentTeacher.find(conditions)
            .populate({ path: "student", select: "name userName authCode" })
            .populate({ path: "teacher", select: "name email" });

        if (data.length < 1) return data;

        const results = [];
        for (let item of data) {
            results.push({
                name: item.student.name,
                userName: item.student.userName,
                password: item.student.authCode,
            });
        }

        return results;
    }
    async declineRequest(teacherId, studentId) {
        const exist = await StudentTeacher.findOne({ student: studentId, teacher: teacherId });

        if (!exist) throw new NotFoundError("invite not found");

        // approve

        exist.studentApproved = false;

        return exist.save();
    }

    async getTeachersByStudentId(studentId) {
        const teachers = await StudentTeacher.find({ student: studentId }).populate({
            path: "teacher",
            select: "name email imageUrl avatar _id",
        });

        return teachers;
    }
    async findOne(conditions) {
        return StudentTeacher.findOne(conditions);
    }
    async getTeacherStudents(teacherId) {
        const students = await StudentTeacher.find({ teacher: teacherId }).populate({
            path: "student",
            select: "name email userName imageUrl avatar _id",
        });

        return students;
    }
}
const studentTeacherService = new StudentTeacherService();
module.exports = studentTeacherService;