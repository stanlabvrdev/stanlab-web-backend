const { TeacherClass } = require("../../models/teacherClass");
const NotFoundError = require("../exceptions/not-found");

class TeacherClassService {
    async create(data) {
        const teacherClass = await TeacherClass.findOne({ title: data.title });

        if (teacherClass) {
          return reject({
            code: 400,
            message: "A class with this title already exist",
          });
        }
        
        const created = new TeacherClass(data);
        return created.save();
    }
    async getOne(conditions) {
        const _class = await TeacherClass.findOne(conditions);

        if (!_class) throw new NotFoundError("class not found");
        return _class;
    }
    async getAll(conditions) {
        return TeacherClass.find(conditions);
    }
}

const teacherClassService = new TeacherClassService();
module.exports = teacherClassService;