import { Student } from "../../models/student";
import generateRandomString from "../../utils/randomStr";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";

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
const studentService = new StudentService();
export default studentService;
