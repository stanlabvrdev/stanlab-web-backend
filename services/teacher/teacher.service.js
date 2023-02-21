const { Teacher } = require("../../models/teacher");
const NotFoundError = require("../exceptions/not-found");

class TeacherService {
    async findOne(conditions) {
        return Teacher.findOne(conditions);
    }
    async getOne(conditions) {
        // const teacher = await Teacher.findOne({ email: "kit_teacher@mail.com" });
        const teacher = await Teacher.findOne(conditions);

        if (!teacher) {
            throw new NotFoundError(`teacher  not found`);
        }
        return teacher;
    }
}

module.exports = new TeacherService();