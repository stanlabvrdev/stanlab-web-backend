const { StudentTeacher } = require("../../models/teacherStudent");
const { StudentTeacherClass } = require("../../models/teacherStudentClass");

class StudentTeacherService {
    async create(teacherId, studentId, classId) {
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

    async getTeachersByStudentId(studentId) {
        const teachers = await StudentTeacher.findOne({ student: studentId }).populate({
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