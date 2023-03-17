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
const { csvUploaderService } = require("../csv-uploader");
const { Profile } = require("../../models/profile");

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

    const teacherProfile = new Profile({
      teacher: teacher._id,
      selectedSchool: school._id,
      isActive: true,
    });
    await teacherProfile.save();

    const response = {
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
    };
    return response;
  }

  async createStudent(body, schoolId) {
    const { name } = body;
    let password = generateRandomString(7);
    let nameParts = name.split(" ");
    let userName = await generateUserName(nameParts[0], nameParts[1]);

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let student = await Student.findOne({ userName });
    if (student) throw new BadRequestError("student already exist");

    const hashedPassword = await passwordService.hash(password);

    student = new Student({
      name,
      userName,
      email: userName,
      password: hashedPassword,
      authCode: password,
    });
    await student.save();

    const schoolStudent = new SchoolStudent({
      school: school._id,
      student: student._id,
    });
    await schoolStudent.save();

    const response = {
      id: student._id,
      name: student.name,
      userName: student.userName,
    };
    return response;
  }

  async bulkCreateStudents(obj, schoolId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    const data = await excelParserService.convertToJSON(obj);
    const promises = [];
    const schools = [];
    for (let item of data) {
      let password = generateRandomString(7);
      const hashedPassword = await passwordService.hash(password);
      let userName = await generateUserName(item.Firstname, item.Surname);

      let existingStudent = await Student.findOne({ userName });
      if (existingStudent) throw new BadRequestError("student already exist");

      const student = new Student({
        name: getFullName(item.Firstname, item.Surname),
        userName,
        email: userName,
        password: hashedPassword,
        authCode: password,
      });
      promises.push(student.save());

      const schoolStudent = new SchoolStudent({
        school: school._id,
        student: student._id,
      });
      schools.push(schoolStudent.save());
    }

    const students = await Promise.all(promises, schools);
    const response = students.map((e) => {
      return {
        id: e._id,
        name: e.name,
        userName: e.userName,
      };
    });
    return response;
  }

  async bulkCreateTeachers(obj, schoolId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const data = await excelParserService.convertToJSON(obj);
    const promises = [];
    const schools = [];
    const profile = [];

    for (let item of data) {
      let password = generateRandomString(7);
      const hashedPassword = await passwordService.hash(password);
      let existingTeacher = await Teacher.findOne({ email: item.Email });
      if (existingTeacher) {
        continue;
      }

      const teacher = new Teacher({
        name: getFullName(item.Firstname, item.Surname),
        email: item.Email,
        password: hashedPassword,
        authCode: password,
      });
      promises.push(teacher.save());

      sendWelcomeEmailToTeacher(teacher, password);

      const schoolTeacher = new SchoolTeacher({
        school: school._id,
        teacher: teacher._id,
      });
      schools.push(schoolTeacher.save());

      const teacherProfile = new Profile({
        teacher: teacher._id,
        selectedSchool: school._id,
        isActive: true,
      });
      profile.push(teacherProfile.save());
    }
    const teachers = await Promise.all(promises, schools, profile);
    const response = teachers.map((e) => {
      return {
        id: e._id,
        name: e.name,
        email: e.email,
      };
    });
    return response;
  }

  async getSchoolAdmin(schoolId) {
    const school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("admin not found");
    return school;
  }

  async getStudents(schoolId) {
    const students = SchoolStudent.find({ school: schoolId })
      .populate({
        path: "student",
        select: ["name", "userName", "authCode", "status"],
      })
      .select([
        "-_id",
        "-school",
        "-studentApproved",
        "-teacher",
        "-createdAt",
        "-__v",
      ]);
    return students;
  }

  async getTeachers(schoolId) {
    const teachers = SchoolTeacher.find({ school: schoolId })
      .populate({ path: "teacher", select: ["name", "email"] })
      .select(["-_id", "-school", "-teacherApproved", "-createdAt", "-__v"]);
    return teachers;
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

    const response = {
      id: teacherClass._id,
      title: teacherClass.title,
      colour: teacherClass.colour,
    };
    return response;
  }

  async addTeacherToClass(schoolId, classId, body) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacher = await Teacher.find({ _id: body.teacherIds });
    if (!teacher) throw new NotFoundError("teacher not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    let promises = [];
    teacher.map(async (element) => {
      const schoolTeacher = await SchoolTeacher.find({
        school: school._id,
        teacher: element._id,
      });
      if (!schoolTeacher) throw new NotFoundError("school teacher not found");

      let existingTeacher = await StudentTeacherClass.findOne({
        school: school._id,
        teacher: element._id,
      });
      if (existingTeacher)
        throw new BadRequestError(
          "teacher have already been added to this class"
        );

      const addteacher = new StudentTeacherClass({
        teacher: element._id,
        class: teacherClass._id,
        school: school._id,
      });
      promises.push(addteacher.save());
    });
    await Promise.all(promises);
  }

  async addStudentToClass(schoolId, classId, body) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const student = await Student.find({ _id: body.studentIds });
    if (!student) throw new NotFoundError("student not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    const promises = [];
    student.map(async (element) => {
      const schoolStudent = await SchoolStudent.find({
        school: school._id,
        student: element._id,
      });
      if (!schoolStudent) throw new NotFoundError("student not found");

      let existingStudents = await StudentTeacherClass.findOne({
        school: school._id,
        student: element._id,
      });
      if (existingStudents)
        throw new BadRequestError(
          "student have already been added to this class"
        );

      const studentClass = new StudentTeacherClass({
        student: element._id,
        class: teacherClass._id,
        school: school._id,
      });
      promises.push(studentClass.save());

      await Student.updateOne({ _id: element._id }, { status: "In class" });
    });
    await Promise.all(promises);
  }

  async getDownload(conditions) {
    const data = await SchoolStudent.find(conditions).populate({
      path: "student",
      select: "name userName authCode",
    });

    if (data.length < 1) return data;

    const results = [];
    for (let item of data) {
      results.push({
        name: item.student.name,
        userName: item.student.userName,
        password: item.student.authCode,
      });
    }

    return results;
  }

  async downloadStudents(schoolId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const result = await this.getDownload({ school: school._id });

    const downloadedUrl = await csvUploaderService.getCsv(
      result,
      "students",
      "student"
    );

    return downloadedUrl;
  }

  async addStudentsToClassInBulk(obj, schoolId, classId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    const data = await excelParserService.convertToJSON(obj);
    const promises = [];

    for (let item of data) {
      let student = await Student.findOne({ userName: item.userName });
      if (!student) {
        continue;
      }

      const schoolStudent = await SchoolStudent.find({
        school: school._id,
        student: student._id,
      });
      if (!schoolStudent) {
        continue;
      }

      let existingStudents = await StudentTeacherClass.findOne({
        school: school._id,
        student: student._id,
      });
      if (existingStudents) {
        continue;
      }

      const studentClass = new StudentTeacherClass({
        student: student._id,
        class: teacherClass._id,
        school: school._id,
      });
      promises.push(studentClass.save());

      await Student.updateOne({ _id: student._id }, { status: "In class" });
    }

    await Promise.all(promises);
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

    let teacherClass = await TeacherClass.find({ school: school._id }).select([
      "title",
      "subject",
      "colour",
    ]);
    if (!teacherClass) throw new NotFoundError("class not found");

    return teacherClass;
  }

  async getClassById(schoolId, classId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let foundClass = await TeacherClass.findById({ _id: classId });
    if (!foundClass) throw new NotFoundError("class not found");

    let teacherClass = await TeacherClass.findOne({
      school: school._id,
      _id: foundClass._id,
    }).select(["title", "subject", "colour"]);
    if (!teacherClass) throw new NotFoundError("class not found");

    return teacherClass;
  }

  async updateClass(body, schoolId, classId) {
    const { title, subject, section, colour } = body;

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let teacherClass = await TeacherClass.findOne({
      _id: classId,
      school: school._id,
    });
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
