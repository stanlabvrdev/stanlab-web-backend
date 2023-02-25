const { passwordService } = require("../../services/passwordService");
const jwt = require("jsonwebtoken");
const envConfig = require("../../config/env");
const env = envConfig.getAll();
const SchoolAdmin = require("../../models/schoolAdmin");
const { Teacher } = require("../../models/teacher");
const generateRandomString = require("../../utils/randomStr");
const teacherClassService = require("../teacherClass/teacherClass.service");
const { TeacherClass } = require("../../models/teacherClass");
const { sendEmailToSchoolAdmin, sendTeacherInviteEmail } = require("../email");
const { Student } = require("../../models/student");
const Papa = require("papaparse");

class SchoolAdminService {
  createSchoolAdmin(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findOne({
          schoolEmail: body.schoolEmail,
        });
        const admin = await SchoolAdmin.findOne({
          email: body.email,
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

        body.password = await passwordService.hash(body.password);

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

        await passwordService.compare(body.password, school.password);

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
        const token = jwt.sign({ _id: id, role }, env.jwtKey);
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

  updateSchoolAdmin(schoolId, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const school = await SchoolAdmin.findById({ _id: schoolId });
        await school.updateOne(body);
        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  addATeacher(schoolId, body) {
    return new Promise(async (resolve, reject) => {
      try {
        const registeredStudent = await Student.findOne({ email: body.email });
        if (registeredStudent) {
          return res.status(401).send({
            message: "You cannot use same email registered as Student",
          });
        }
        const teacher = await Teacher.findOne({ email: body.email });
        if (teacher && teacher.checkIsSchool(schoolId)) {
          return reject({
            code: 400,
            message: "You have already added this teacher",
          });
        }

        //let autoPassword = generateRandomString(7);

        const autoPassword = "12345";
        const hashedPassword = await passwordService.hash(autoPassword);

        const createdTeacher = await Teacher.create({
          ...body,
          password: hashedPassword,
        });
        sendTeacherInviteEmail(createdTeacher, autoPassword);

        console.log(schoolId);

        await Teacher.updateOne(
          { _id: createdTeacher },
          { schools: { school: schoolId } }
        );

        await SchoolAdmin.updateOne({
          $addToSet: { teachers: [createdTeacher._id] },
        });

        resolve(createdTeacher);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addBulkTeachers(file, schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const autoPassword = "12345";
        const hashedPassword = await passwordService.hash(autoPassword);

        const csvData = [];
        Papa.parse(file, {
          header: true,
          step: function (result) {
            csvData.push(result.data);
          },
        });

        for (const teacher of csvData) {
          //let autoPassword = generateRandomString(7);
          // const hashedPassword = await passwordService.hash(autoPassword);

          const registeredStudent = await Student.findOne({
            email: teacher.Email,
          });
          if (registeredStudent)
            return res.status(401).send({
              message: "You cannot use same email registered as Student",
            });

          const isteacher = await Teacher.findOne({ email: teacher.Email });
          if (isteacher && isteacher.checkIsSchool(schoolId)) {
            return reject({
              code: 400,
              message: "You have already added this teacher",
            });
          }
          const newTeachers = await Teacher.create({
            name: `${teacher.Firstname} ${teacher.Surname}`,
            email: `${teacher.Email}`,
            password: hashedPassword,
          });

          sendTeacherInviteEmail(newTeachers.email, autoPassword);

          await Teacher.updateOne(
            { _id: newTeachers },
            { schools: { school: schoolId } }
          );

          await SchoolAdmin.updateOne(
            { _id: schoolId },
            {
              $addToSet: { teachers: [newTeachers._id] },
            }
          );
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
            select: " -password -role -schools -__v",
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
        const createdTeacherClass = await teacherClassService.create(body);

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
        });

        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  getClasses(filter) {
    return new Promise(async (resolve, reject) => {
      try {
        const classes = await TeacherClass.find({
          ...filter,
        });

        resolve(classes);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addAStudent(schoolId, body) {
    return new Promise(async (resolve, reject) => {
      try {
        //let autoPassword = generateRandomString(7);
        const autoPassword = "12345";
        const hashedPassword = await passwordService.hash(autoPassword);

        const random = Math.floor(1000 + Math.random() * 9000);

        const userName = `${body.name.substring(0, 3)}${body.surname.substring(
          0,
          3
        )}${random}`;

        const createdStudent = await Student.create({
          name: `${body.name} ${body.surname}`,
          password: hashedPassword,
          userName,
        });

        await SchoolAdmin.updateOne(
          { _id: schoolId },
          {
            $addToSet: { students: createdStudent._id },
          }
        );
        await Student.updateOne(
          { _id: createdStudent._id },
          { school: schoolId }
        );

        resolve(createdStudent);
      } catch (error) {
        return reject(error);
      }
    });
  }

  addBulkStudents(file, schoolId) {
    return new Promise(async (resolve, reject) => {
      try {
        const autoPassword = "12345";
        const hashedPassword = await passwordService.hash(autoPassword);

        const csvData = [];
        Papa.parse(file, {
          header: true,
          step: function (result) {
            csvData.push(result.data);
          },
        });

        for (const student of csvData) {
          const newStudents = await Student.create({
            name: `${student.Firstname} ${student.Surname}`,
            userName: `${student.Firstname.substring(
              0,
              3
            )}${student.Surname.substring(0, 3)}${Math.floor(
              1000 + Math.random() * 9000
            )}`,
            password: hashedPassword,
          });

          await SchoolAdmin.updateOne(
            { _id: schoolId },
            {
              $addToSet: { students: newStudents._id },
            }
          );
          await Student.updateOne(
            { _id: newStudents._id },
            { school: schoolId }
          );
        }

        resolve();
      } catch (error) {
        return reject(error);
      }
    });
  }

  addStudentToClass(body) {
    return new Promise(async (resolve, reject) => {
      try {
        const student = await Student.findOne({
          userName: body.userName,
        });
        if (!student) {
          return reject({
            code: 400,
            message: "Student was not found",
          });
        }

        const teacherClass = await TeacherClass.findById({ _id: body.classId });
        if (!teacherClass) {
          return reject({
            code: 400,
            message: "Class was not found",
          });
        }

        await teacherClass.updateOne({
          $addToSet: { students: [student._id] },
        });
        await Student.updateOne(
          { _id: student._id },
          {
            $addToSet: { classes: [teacherClass._id] },
            teachers: { teacher: teacherClass.teacher, isAccepted: true },
          }
        );
        await Teacher.updateOne(
          { _id: teacherClass.teacher },
          {
            students: { student: student._id, isAccepted: true },
          }
        );

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
