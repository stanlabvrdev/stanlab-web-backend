const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");
const SchoolAdmin = require("../models/schoolAdmin");
const { Teacher } = require("../models/teacher");
const generateRandomString = require("../utils/randomStr");
const { TeacherClass } = require("../models/teacherClass");
const { sendEmailToSchoolAdmin, sendTeacherInviteEmail } = require("./email");
const { Student } = require("../models/student");
const Papa = require("papaparse");

class SchoolAdminService {
  createSchoolAdmin(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findOne({
          schoolEmail: body.schoolEmail,
        });
        const admin = await SchoolAdmin.findOne({
          adminEmail: body.adminEmail,
        });

        if (school) {
          return reject({
            code: 400,
            message: "School with this email already exists",
          });
        }
        if (admin) {
          return reject({
            code: 400,
            message: "Admin with this email already exists",
          });
        }

        const salt = await bcrypt.genSalt(10);
        body.password = await bcrypt.hash(body.password, salt);

        const createdSchoolAdmin = await SchoolAdmin.create(body);

        sendEmailToSchoolAdmin(
          createdSchoolAdmin.schoolEmail,
          createdSchoolAdmin.schoolName
        );
        resolve(createdSchoolAdmin);
      } catch (error) {
        return reject(error);
      }
    });
  }

  schoolAdminLogin(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findOne({
          schoolEmail: body.schoolEmail,
        });
        if (!school) {
          return reject({
            code: 404,
            message: "Not found",
          });
        }

        const isEqual = await bcrypt.compare(body.password, school.password);
        if (!isEqual) {
          return reject({
            code: 400,
            message: "Password incorrect",
          });
        }

        school.password = undefined;
        const token = await this.generateAuthToken(school._id, school.role);
        if (!token) {
          return reject({
            code: 400,
            msg: "Could not sign user",
          });
        }

        resolve({ token });
      } catch (error) {
        return reject(error);
      }
    });
  }

  generateAuthToken(id, role) {
    return new Promise(async (resolve, reject) => {
      try {
        const token = jwt.sign({ _id: id, role }, config.get("jwtKey"));
        resolve(token);
      } catch (error) {
        return reject(error);
      }
    });
  }

  getSchoolAdmin(schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById({ _id: schoolId });
        resolve(school);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addATeacher(schoolId, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById(schoolId);

        const teacher = await Teacher.findOne({ email: body.email });
        if (teacher && teacher.checkIsSchool(schoolId)) {
          return reject({
            code: 400,
            message: "You have already added this teacher",
          });
        }

        //let password = generateRandomString(7);

        const autoPassword = "12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const createdTeacher = await Teacher.create({
          ...body,
          password: hashedPassword,
        });

        sendTeacherInviteEmail(createdTeacher, autoPassword);

        await createdTeacher.updateOne({
          schools: { $addToSet: { school: schoolId } },
        });

        await school.updateOne({ $addToSet: { teachers: createdTeacher._id } });

        resolve(createdTeacher);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addBulkTeachers(file, schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById(schoolId);

        const autoPassword = "12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const csvData = [];
        Papa.parse(file, {
          header: true,
          step: function (result) {
            csvData.push(result.data);
          },
        });

        for (const teacher of csvData) {
          //let password = generateRandomString(7);
          // const autoPassword = "12345";
          // const salt = await bcrypt.genSalt(10);
          // const hashedPassword = await bcrypt.hash(autoPassword, salt);
          const teachers = await Teacher.create({
            ...teacher,
            password: hashedPassword,
          });

          sendTeacherInviteEmail(teachers, autoPassword);

          await teachers.updateOne({
            schools: { $addToSet: { school: schoolId } },
          });

          await school.updateOne({
            $addToSet: { teachers: teachers._id },
          });
        }

        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  getTeachers(schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const teachers = await SchoolAdmin.findById({ _id: schoolId })
          .populate({
            path: "teachers",
            select: "-students -password -role -schools -__v",
          })
          .select("teachers");
        resolve(teachers);
      } catch (error) {
        return reject(error);
      }
    });
  }

  createClass(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const teacherClass = await TeacherClass.findOne({ title: body.title });

        if (teacherClass) {
          return reject({
            code: 400,
            message: "A class with this title already exist",
          });
        }

        const createdTeacherClass = await TeacherClass.create(body);

        resolve(createdTeacherClass);
      } catch (error) {
        return reject(error);
      }
    });
  }

  assignTeacherToClass(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const teacher = await Teacher.findById({ _id: body.teacherId });
        if (!teacher) {
          return reject({
            code: 400,
            message: "Teacher was not found",
          });
        }

        const teacherClass = await TeacherClass.findById({ _id: body.classId });
        if (!teacherClass) {
          return reject({
            code: 400,
            message: "Class was not found",
          });
        }

        await teacherClass.updateOne({ teacher: teacher._id });
        await teacher.updateOne({
          $addToSet: { classes: teacherClass._id },
        })

        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  getClasses() {
    return new Promise(async (resolve, reject) => {
      try {
        const classes = await TeacherClass.find();
        resolve(classes);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addAStudent(schoolId, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById(schoolId);

        const autoPassword = "12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const random = Math.floor(1000 + Math.random() * 9000);

        const userName = `${body.name.substring(0, 3)}${body.surname.substring(
          0,
          3
        )}${random}`;

        const createdStudent = await Student.create({
          ...body,
          password: hashedPassword,
          userName,
        });

        await school.updateOne({ $addToSet: { students: createdStudent._id } });
        await createdStudent.updateOne({ $addToSet: { school: schoolId } });

        resolve(createdStudent);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addBulkStudents(file, schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById(schoolId);

        const autoPassword = "12345";
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(autoPassword, salt);

        const csvData = [];
        Papa.parse(file, {
          header: true,
          step: function (result) {
            csvData.push(result.data);
          },
        });

        for (const student of csvData) {
          const students = await Student.create({
            ...student,
            userName: `${student.name.substring(
              0,
              3
            )}${student.surname.substring(0, 3)}${Math.floor(
              1000 + Math.random() * 9000
            )}`,
            password: hashedPassword,
          });

          await school.updateOne({
            $addToSet: { students: students._id },
          });
          await students.updateOne({ $addToSet: { school: schoolId } });
        }

        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  getStudents(schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const students = await SchoolAdmin.findById({ _id: schoolId })
          .populate({
            path: "students",
            select:
              "-unregisteredTeacher -teachers -password -role -school -__v -signupDate",
          })
          .select("students");
        resolve(students);
      } catch (error) {
        return reject(error);
      }
    });
  }
}

module.exports = SchoolAdminService;
