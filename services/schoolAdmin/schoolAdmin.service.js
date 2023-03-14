const { SchoolAdmin } = require("../../models/schoolAdmin");
const { Teacher } = require("../../models/teacher");
const { Student } = require("../../models/student");
const { SchoolTeacher } = require("../../models/schoolTeacher");
const { SchoolStudent } = require("../../models/schoolStudent");
const {
  sendEmailToSchoolAdmin,
  sendWelcomeEmailToTeacher,
} = require("../email");
const NotFoundError = require("../exceptions/not-found");
const { passwordService } = require("../passwordService");
const generateRandomString = require("../../utils/randomStr");
const { generateUserName, getFullName } = require("../student/generator");
const BadRequestError = require("../exceptions/bad-request");
const { excelParserService } = require("../excelParserService");
const { TeacherClass } = require("../../models/teacherClass");
const { StudentTeacherClass } = require("../../models/teacherStudentClass");

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
    sendWelcomeEmailToTeacher(teacher, password);

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
      email: await generateUserName(nameParts[0], nameParts[1]),
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

  async bulkCreateStudents(obj, schoolId) {
    const data = await excelParserService.convertToJSON(obj);
    const promises = [];
    const schools = [];
    for (let item of data) {
      let password = generateRandomString(7);
      const hashedPassword = await passwordService.hash(password);

      const student = new Student({
        name: getFullName(item.Firstname, item.Surname),
        userName: await generateUserName(item.Firstname, item.Surname),
        email: await generateUserName(item.Firstname, item.Surname),
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

  async getStudents(schoolId) {
    const students = SchoolStudent.find({ school: schoolId })
      .populate("student")
      .select("-school");
    return students;
  }

  async createClass(body, schoolId) {
    const { title, subject, section, colour } = body;

    const existingClass = await TeacherClass.findOne({ title });
    if (existingClass)
      throw new BadRequestError("class with this title already exists");

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const teacherClass = new TeacherClass({
      title,
      subject,
      section,
      school: school._id,
      colour,
    });
    await teacherClass.save();

    const studentTeacherClass = new StudentTeacherClass({
      class: teacherClass._id,
      school: school._id,
    });
    await studentTeacherClass.save();
  }

  async addTeacherToClass(schoolId, classId, teacherId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacher = await Teacher.findOne({ _id: teacherId });
    if (!teacher) throw new NotFoundError("teacher not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    let schoolTeacher = await SchoolTeacher.findOne({
      school: school._id,
      teacher: teacher._id,
    });
    if (!schoolTeacher) throw new NotFoundError("school teacher not found");

    let schoolClass = await StudentTeacherClass.findOne({
      school: school._id,
      class: teacherClass._id,
    });
    if (!schoolClass) throw new NotFoundError("school class not found");

    schoolClass.teacher = teacher._id;
    schoolClass.save();
  }

  async addStudentToClass(schoolId, classId, studentId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const student = await Student.findOne({ _id: studentId });
    if (!student) throw new NotFoundError("student not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    let schoolStudent = await SchoolStudent.findOne({
      school: school._id,
      student: student._id,
    });
    if (!schoolStudent) throw new NotFoundError("school student not found");

    let schoolClass = await StudentTeacherClass.findOne({
      school: school._id,
      class: teacherClass._id,
    });
    if (!schoolClass) throw new NotFoundError("school class not found");

    const studentClass = new StudentTeacherClass({
      student: student._id,
      class: teacherClass._id,
      school: school._id,
    });

    studentClass.save();
  }

  async getStudentsByClass(schoolId, classId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    let classStudent = await StudentTeacherClass.find({
      school: schoolId,
      class: classId,
    })
      .populate({ path: "student", select: ["name", "userName"] })
      .select(["-_id", "-school", "-class", "-teacher", "-createdAt", "-__v"]);

    return classStudent;
  }

  async getTeacherClasses(schoolId, classId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    let teacher = await StudentTeacherClass.findOne({
      school: schoolId,
      class: classId,
    })
      .populate({ path: "teacher", select: ["name", "email"] })
      .select(["-_id", "-school", "-createdAt", "-class", "-student", "-__v"]);

    return teacher;
  }

  async getClasses(schoolId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let teacherClass = await TeacherClass.find({ school: school._id }).select(["title", "subject"]);
    if (!teacherClass) throw new NotFoundError("class not found");

    return teacherClass;
  }

  async updateClass(body, schoolId, classId) {
    const { title, subject, section, colour } = body;

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let teacherClass = await TeacherClass.findOne({ _id: classId, school: school._id });
    if (!teacherClass) throw new NotFoundError("class not found");

    teacherClass.title = title;
    teacherClass.subject = subject;
    teacherClass.section = section;
    teacherClass.colour = colour;

    await teacherClass.save();
  }
}

const schoolAdminService = new SchoolAdminService();
module.exports = schoolAdminService;
