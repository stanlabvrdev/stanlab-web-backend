const { Student } = require("../../models/student");
const generateRandomString = require("../../utils/randomStr");

class StudentService {
    async create(data) {
        data.authCode = generateRandomString(5);
        const student = new Student(data);

        return student.save();
    }
}

module.exports = new StudentService();