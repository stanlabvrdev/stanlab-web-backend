const { Student } = require("../../models/student");
const generateRandomString = require("../../utils/randomStr");
const NotFoundError = require("../exceptions/not-found");
const { passwordService } = require("../passwordService");

class StudentService {
    async create(data) {
        data.authCode = generateRandomString(5);
        const hashedPassword = await passwordService.hash(data.authCode);
        data.password = data.password || hashedPassword;
        data.email = data.email || data.userName;
        const student = new Student(data);

        return student.save();
    }

    async findOne(conditions) {
        return Student.findOne(conditions);
    }
    async getOne(conditions) {
        const student = await this.findOne(conditions);

        if (!student) {
            throw new NotFoundError(`student  not found`);
        }
        return student;
    }
    async getOneAndFilter(conditions) {
        const student = await Student.findOne(conditions).select("-password -__v -avatar");

        if (!student) {
            throw new NotFoundError(`student  not found`);
        }
        return student;
    }
}

module.exports = new StudentService();