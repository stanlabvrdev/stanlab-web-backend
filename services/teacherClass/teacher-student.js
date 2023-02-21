const { StudentTeacher } = require("../../models/teacherStudent");

class StudentTeacherService {
    async create(teacherId, studentId, classId) {
        const newStudentTeacher = new StudentTeacher({
            teacher: teacherId,
            student: studentId,
            class: classId,
        });

        return newStudentTeacher.save();
    }
}

module.exports = new StudentTeacherService();