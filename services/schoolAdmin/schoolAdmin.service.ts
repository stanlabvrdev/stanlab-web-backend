import { SchoolAdmin } from "../../models/schoolAdmin";
import { Teacher } from "../../models/teacher";
import { Student } from "../../models/student";
import { SchoolTeacher } from "../../models/schoolTeacher";
import { SchoolStudent } from "../../models/schoolStudent";
import { sendEmailToSchoolAdmin, sendWelcomeEmailToTeacher } from "../email";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";
import generateRandomString from "../../utils/randomStr";
import { generateUserName, getFullName } from "../student/generator";
import BadRequestError from "../exceptions/bad-request";
import { excelParserService } from "../excelParserService";
import { TeacherClass } from "../../models/teacherClass";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import { csvUploaderService } from "../csv-uploader";
import { Profile } from "../../models/profile";
import { StudentSubscription } from "../../models/student-subscription";
import subscriptionService from "../subscription/subscription.service";
import { addDaysToDate } from "../../helpers/dateHelper";

class SchoolAdminService {
  async createSchoolAdmin(body) {
    let {
      admin_name,
      admin_title,
      school_name,
      password,
      admin_email,
      country,
    } = body;

    let admin = await SchoolAdmin.findOne({ email: admin_email });
    if (admin)
      throw new BadRequestError("admin with this email already exists");

    password = await passwordService.hash(password);

    admin = new SchoolAdmin({
      password,
      email: admin_email,
      schoolEmail: admin_email,
      adminName: admin_name,
      adminTitle: admin_title,
      schoolName: school_name,
      country,
    });

    const token = admin.generateAuthToken();
    await admin.save();
    sendEmailToSchoolAdmin(admin);
    return { admin, token };
  }

  async createTeacher(body: any, schoolId: string) {
    const { name, email } = body;
    let password = generateRandomString(7);

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    let teacher = await Teacher.findOne({ email });

    if (!teacher) {
      const hashedPassword = await passwordService.hash(password);

      teacher = new Teacher({
        name,
        email,
        password: hashedPassword,
        schoolTeacher: true,
      });

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
      });
      await teacherProfile.save();

      const response = {
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        schoolTeacher: teacher.schoolTeacher,
      };
      return response;
    }

    let existingSchoolTeacher = await SchoolTeacher.findOne({
      school: school._id,
      teacher: teacher._id,
    });

    if (existingSchoolTeacher) {
      throw new BadRequestError("teacher already exists in this school");
    }

    teacher.schoolTeacher = true;
    await teacher.save();

    // sendWelcomeEmailToTeacher(teacher, password);

    const schoolTeacher = new SchoolTeacher({
      school: school._id,
      teacher: teacher._id,
    });
    await schoolTeacher.save();

    const teacherProfile = new Profile({
      teacher: teacher._id,
      selectedSchool: school._id,
    });
    await teacherProfile.save();
  }

  async makeSubAdmin(schoolId: string, teacherId: string) {
    const schoolTeacher = await SchoolTeacher.findOne({
      school: schoolId,
      teacher: teacherId,
    });

    if (schoolTeacher) {
      let teacher = await Teacher.findById(schoolTeacher.teacher);

      teacher.subAdmin = schoolId;
      teacher.save()
    }
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

    const freePlan = await subscriptionService.getFreePlan();

    const studentSubscription = new StudentSubscription({
      school: school._id,
      student: student._id,
      subscriptionPlanId: freePlan._id,
      endDate: addDaysToDate(freePlan.duration),
      extensionDate: addDaysToDate(freePlan.duration),
      autoRenew: false,
    });
    await studentSubscription.save();

    const response = {
      id: student._id,
      name: student.name,
      userName: student.userName,
    };
    return response;
  }

  async bulkCreateStudents(obj, schoolId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    const data: any[] = await excelParserService.convertToJSON(obj);

    const promises: any[] = [];
    const schools: any[] = [];
    const subscribers: any[] = [];

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

      const freePlan = await subscriptionService.getFreePlan();

      const studentSubscription = new StudentSubscription({
        school: school._id,
        student: student._id,
        subscriptionPlanId: freePlan._id,
        endDate: addDaysToDate(freePlan.duration),
        extensionDate: addDaysToDate(freePlan.duration),
        autoRenew: false,
      });
      subscribers.push(studentSubscription.save());
    }

    const students = await Promise.all(promises);
    await Promise.all(schools);
    await Promise.all(subscribers);

    const response = students.map((e) => {
      return {
        id: e._id,
        name: e.name,
        userName: e.userName,
      };
    });
    return response;
  }

  async bulkCreateTeachers(obj: any, schoolId: string) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const data: any[] = await excelParserService.convertToJSON(obj);
    const promises: any[] = [];
    const schools: any[] = [];
    const profile: any[] = [];

    for (let item of data) {
      let password = generateRandomString(7);
      const hashedPassword = await passwordService.hash(password);

      let existingTeacher = await Teacher.findOne({ email: item.Email });

      if (!existingTeacher) {
        const teacher = new Teacher({
          name: getFullName(item.Firstname, item.Surname),
          email: item.Email,
          password: hashedPassword,
          authCode: password,
          schoolTeacher: true,
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
        });
        profile.push(teacherProfile.save());
      }

      if (existingTeacher) {
        let existingSchoolTeacher = await SchoolTeacher.findOne({
          school: school._id,
          teacher: existingTeacher._id,
        });

        if (existingSchoolTeacher) {
          continue;
        }

        existingTeacher.schoolTeacher = true;
        await existingTeacher.save();

        //sendWelcomeEmailToTeacher(existingTeacher, password);

        const schoolTeacher = new SchoolTeacher({
          school: school._id,
          teacher: existingTeacher._id,
        });
        schools.push(schoolTeacher.save());

        const teacherProfile = new Profile({
          teacher: existingTeacher._id,
          selectedSchool: school._id,
        });
        profile.push(teacherProfile.save());
      }
    }

    await Promise.all([promises, schools, profile]);
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
      .populate({ path: "teacher", select: ["name", "email", "schoolTeacher", "subAdmin"] })
      .select(["-_id", "-school", "-teacherApproved", "-createdAt", "-__v"]);
    return teachers;
  }

  async createClass(body, schoolId) {
    const { title, subject, section, colour } = body;

    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const existingClass = await TeacherClass.findOne({
      title,
      school: school._id,
    });

    if (existingClass)
      throw new BadRequestError("class with this title already exists");

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

    let promises: any[] = [];
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

  async addStudentToClass(schoolId: string, classId: string, body: any) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    const { name } = body;
    let password = generateRandomString(7);
    let nameParts = name.split(" ");
    let userName = await generateUserName(nameParts[0], nameParts[1]);

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

    const schoolStudent = new SchoolStudent({
      school: school._id,
      student: student._id,
    });
    await schoolStudent.save();

    const studentClass = new StudentTeacherClass({
      student: student._id,
      class: teacherClass._id,
      school: school._id,
    });
    await studentClass.save();

    student.status = "In class";
    await student.save();

    teacherClass.students.push(student._id);
    await teacherClass.save();

    const freePlan = await subscriptionService.getFreePlan();

    const studentSubscription = new StudentSubscription({
      school: school._id,
      student: student._id,
      subscriptionPlanId: freePlan._id,
      endDate: addDaysToDate(freePlan.duration),
      extensionDate: addDaysToDate(freePlan.duration),
      autoRenew: false,
    });
    await studentSubscription.save();
  }

  async getDownload(conditions) {
    const data = await SchoolStudent.find(conditions).populate({
      path: "student",
      select: "name userName authCode",
    });

    if (data.length < 1) return data;

    const results: any = [];
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

  async getDownloadByClass(conditions) {
    const data = await StudentTeacherClass.find(conditions).populate({
      path: "student",
      select: "name userName authCode",
    });

    if (data.length < 1) return data;

    const results: any = [];
    for (let item of data) {
      results.push({
        name: item.student.name,
        userName: item.student.userName,
        password: item.student.authCode,
      });
    }

    return results;
  }

  async downloadStudentsByClass(schoolId, classId) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });
    if (!school) throw new NotFoundError("school admin not found");

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    const result = await this.getDownloadByClass({
      school: school._id,
      class: teacherClass._id,
    });

    const downloadedUrl = await csvUploaderService.getCsv(
      result,
      "students",
      "student"
    );

    return downloadedUrl;
  }

  async addStudentsToClassInBulk(obj: any, schoolId: string, classId: string) {
    let school = await SchoolAdmin.findOne({ _id: schoolId });

    const teacherClass = await TeacherClass.findOne({ _id: classId });
    if (!teacherClass) throw new NotFoundError("class not found");

    const promises: any[] = [];
    const schools: any[] = [];
    const subscribers: any[] = [];
    const classes: any[] = [];
    const students: any[] = [];

    const data: any[] = await excelParserService.convertToJSON(obj);

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

      const schoolStudent = new SchoolStudent({
        school: school._id,
        student: student._id,
      });
      schools.push(schoolStudent.save());

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
      classes.push(studentClass.save());

      student.status = "In class";
      promises.push(student.save());

      teacherClass.students.push(student._id);
      students.push(teacherClass.save());

      const freePlan = await subscriptionService.getFreePlan();

      const studentSubscription = new StudentSubscription({
        school: school._id,
        student: student._id,
        subscriptionPlanId: freePlan._id,
        endDate: addDaysToDate(freePlan.duration),
        extensionDate: addDaysToDate(freePlan.duration),
        autoRenew: false,
      });
      subscribers.push(studentSubscription.save());
    }

    await Promise.all([promises, schools, subscribers, classes, students]);
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
      .populate({ path: "student", select: ["name", "userName", "authCode"] })
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

  async updateSchoolAdmin(body: any, schoolId: string) {
    let {
      admin_name,
      admin_title,
      school_name,
      admin_email,
      password,
      country,
    } = body;

    let admin = await SchoolAdmin.findById({ _id: schoolId });
    if (!admin) throw new BadRequestError("admin not found");

    if (password) {
      password = await passwordService.hash(password);
    }

    admin.email = admin_email;
    admin.adminName = admin_name;
    admin.adminTitle = admin_title;
    admin.schoolName = school_name;
    admin.password = password;
    admin.country = country;

    return admin.save();
  }
}

export const schoolAdminService = new SchoolAdminService();
export default schoolAdminService;
