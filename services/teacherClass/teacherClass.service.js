const { TeacherClass } = require("../../models/teacherClass");

class TeacherClassService {
    async create(data) {
        const created = new TeacherClass(data);
        return created.save();
    }
}

module.exports = new TeacherClassService();