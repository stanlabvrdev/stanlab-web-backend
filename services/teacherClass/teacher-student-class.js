const { StudentTeacher } = require("../../models/teacherStudent");
const { StudentTeacherClass } = require("../../models/teacherStudentClass");
const NotFoundError = require("../exceptions/not-found");
const BadRequestError = require("../exceptions/bad-request");

class StudentTeacherClassService {
    async getAll(conditions) {
        return StudentTeacherClass.find(conditions)
            .populate({ path: "class", select: "title subject _id" })
            .populate({
                path: "student",
                select: "name email imageUrl avatar _id isAccepted",
            })
            .populate({
                path: "teacher",
                select: "name email imageUrl avatar _id isAccepted",
            });
    }
    async getTeacherStudent(teacherId, studentId) {
        const student = await StudentTeacherClass.findOne({ teacher: teacherId, student: studentId });

        if (!student) throw new NotFoundError("class student not found");

        return student;
    }
    async findTeacherStudent(teacherId, studentId) {
        return StudentTeacherClass.findOne({ teacher: teacherId, student: studentId });
    }
    async create(data) {
        const exist = await StudentTeacherClass.findOne(data);

        console.log(exist);

        if (exist) {
            throw new BadRequestError("student already exist in class");
        }

        const newRecord = new StudentTeacherClass(data);
        await newRecord.save();
        return newRecord;
    }
}
const studentTeacherClassService = new StudentTeacherClassService();
module.exports = studentTeacherClassService;