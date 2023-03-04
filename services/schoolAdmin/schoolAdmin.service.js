const { SchoolAdmin } = require("../../models/schoolAdmin");
const { Teacher } = require("../../models/teacher");
const { Student } = require("../../models/student");
const { SchoolTeacher } = require("../../models/schoolTeacher");
const { SchoolStudent } = require("../../models/schoolStudent");
const { sendEmailToSchoolAdmin, sendTeacherWelcomeEmail } = require("../email");
const NotFoundError = require("../exceptions/not-found");
const { passwordService } = require("../passwordService");
const generateRandomString = require("../../utils/randomStr");
const { generateUserName, getFullName } = require("../student/generator");
const BadRequestError = require("../exceptions/bad-request");
const { excelParserService } = require("../excelParserService");

class SchoolAdminService {
  async createSchoolAdmin(body) {
    let { admin_name, school_name, password, admin_email, school_email } = body;

    let admin = await SchoolAdmin.findOne({ email: admin_email });
    if (admin)
      throw new BadRequestError("admin with this email already exists");

    let school = await SchoolAdmin.findOne({
      schoolEmail: school_email,
    });
    if (school)
      throw new BadRequestError("school with this email already exists");

    password = await passwordService.hash(password);

    admin = new SchoolAdmin({
      password,
      email: admin_email,
      schoolEmail: school_email,
      adminName: admin_name,
      schoolName: school_name,
    });

    const token = admin.generateAuthToken();
    await admin.save();
    sendEmailToSchoolAdmin(admin);
    return { admin, token };
  }

  async createTeacher(body, schoolId) {
    const { name, email } = body;
    let password = generateRandomString(7);

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let teacher = await Teacher.findOne({ email });
    if (teacher) throw new BadRequestError("teacher already exists");

    const hashedPassword = await passwordService.hash(password);

    teacher = new Teacher({ name, email, password: hashedPassword });

    await teacher.save();
    sendTeacherWelcomeEmail(teacher, password);

    const schoolTeacher = new SchoolTeacher({
      school: school._id,
      teacher: teacher._id,
    });
    await schoolTeacher.save();
  }

  async createStudent(body, schoolId) {
    const { name, email } = body;
    let password = generateRandomString(7);

    let school = await SchoolAdmin.findOne({ _id: schoolId });
    let student = await Student.findOne({
      $or: [{ email }, { userName: email }],
    });

    if (student) throw new BadRequestError("student already exist");

    const hashedPassword = await passwordService.hash(password);
    let nameParts = name.split(" ");

    student = new Student({
      name,
      userName: await generateUserName(nameParts[0], nameParts[1]),
      password: hashedPassword,
      authCode: password,
    });
    await student.save();

    const schoolStudent = new SchoolStudent({
      school: school._id,
      student: student._id,
    });
    await schoolStudent.save();
  }

  async bulkCreateStudents(file, schoolId) {
    const data = await excelParserService.convertToJSON(file);
    const promises = [];
    const schools = [];
    for (let item of data) {
      let password = generateRandomString(7);
      const hashedPassword = await passwordService.hash(password);

      const student = new Student({
        name: getFullName(item.Firstname, item.Surname),
        userName: await generateUserName(item.Firstname, item.Surname),
        password: hashedPassword,
        authCode: password,
      });
      promises.push(student.save());

      const schoolStudent = new SchoolStudent({
        school: schoolId,
        student: student._id,
      });
      schools.push(schoolStudent.save());
    }
    await Promise.all(promises, schools);
  }

  async getSchoolAdmin(schoolId) {
    const school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("admin not found");
    return school;
  }

  async getTeachers(schoolId) {
    const teacher = SchoolTeacher.find({ school: schoolId })
      .populate("teacher")
      .select("-school -__v");
    return teacher;
  }

  async getStudents(schoolId) {
    const students = SchoolStudent.find({ school: schoolId })
      .populate("student")
      .select("-school");
    return students;
  }
}

const schoolAdminService = new SchoolAdminService();
module.exports = schoolAdminService;
