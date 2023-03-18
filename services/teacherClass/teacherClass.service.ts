import { TeacherClass } from "../../models/teacherClass";
import NotFoundError from "../exceptions/not-found";

class TeacherClassService {
  async create(data) {
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
export default teacherClassService;
