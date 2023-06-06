import sharp from "sharp";
import bcrypt from "bcryptjs";
import _ from "lodash";
import generator from "generate-password";

import { Teacher, validateTeacher, validateUpdateTeacher } from "../models/teacher";
import { Student } from "../models/student";
import { TeacherClass, validateClass } from "../models/teacherClass";
import QuizClasswork from "../models/quizClasswork";
import Experiment from "../models/experiment";
import { doSendInvitationEmail } from "../services/email";
import { LabExperiment } from "../models/labAssignment";

import { ServerErrorHandler, ServerResponse } from "../services/response/serverResponse";
import studentTeacherService from "../services/teacherClass/teacher-student";
import teacherClassService from "../services/teacherClass/teacherClass.service";
import { doValidate } from "../services/exceptions/validator";
import teacherService from "../services/teacher/teacher.service";
import BadRequestError from "../services/exceptions/bad-request";
import studentService from "../services/student/student.service";
import { Profile } from "../models/profile";
import NotFoundError from "../services/exceptions/not-found";
import teacherProfileService from "../services/teacher/profile.service";
import { Request, Response } from "express";
import { StudentTeacherClass } from "../models/teacherStudentClass";
import { SchoolAdmin } from "../models/schoolAdmin";
import { validateStudent } from "../validations/schoolAdmin.validation";
import generateRandomString from "../utils/randomStr";
import { generateUserName, getFullName } from "../services/student/generator";
import { passwordService } from "../services/passwordService";
import { SchoolStudent } from "../models/schoolStudent";
import subscriptionService from "../services/subscription/subscription.service";
import { StudentSubscription } from "../models/student-subscription";
import { addDaysToDate } from "../helpers/dateHelper";
import { excelParserService } from "../services/excelParserService";

async function deleteStudent(req, res) {
  const { studentId } = req.params;
  try {
    let teacher = await Teacher.findOne({ _id: req.teacher._id });
    let student = await Student.findOne({ _id: studentId });

    let updatedTeacher = teacher.removeStudent(studentId);
    if (!updatedTeacher) return res.status(404).send({ message: "Student not found" });

    await updatedTeacher.save();
    if (!student) return res.status(400).send({ message: "Something is wrong" });

    student = student.markTeacherAsRemoved(teacher._id);
    await student.save();
    res.status(204).send(true);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function createClass(req, res) {
  const { title, subject, section } = req.body;

  doValidate(validateClass(req.body));

  try {
    const teacherClass = await teacherClassService.create({
      title,
      subject,
      section,
      teacher: req.teacher._id,
    });

    ServerResponse(req, res, 200, teacherClass, "class created successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function createSchoolClass(req, res) {
  const { title, subject, section, colour } = req.body;

  doValidate(validateClass(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin)
    if (!school) {
      throw new BadRequestError("unauthorized school sub admin");
    }

    const teacherClass = await teacherClassService.create({
      title,
      subject,
      section,
      colour,
      school: school._id,
    });

    ServerResponse(req, res, 200, teacherClass, "class created successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function addSchoolStudentToClass(req, res) {
  try {
    doValidate(validateStudent(req.body));

    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin)
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    const teacherClass = await TeacherClass.findOne({
      _id: req.params.classId,
      school: teacher.subAdmin
    });
    if (!teacherClass) throw new NotFoundError("class not found");

    const { name } = req.body;
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

    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function addSchoolStudentToClassInBulk(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin)
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    const teacherClass = await TeacherClass.findOne({
      _id: req.params.classId,
      school: teacher.subAdmin
    });
    if (!teacherClass) throw new NotFoundError("class not found");

    const promises: any[] = [];
    const schools: any[] = [];
    const subscribers: any[] = [];
    const classes: any[] = [];
    const students: any[] = [];

    const data: any[] = await excelParserService.convertToJSON(req);

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

    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function getClass(req, res) {
  try {
    // const teacherClasses = await Teacher.findOne({ _id: req.teacher._id }).populate("classes").select("classes");

    let teacherCurrentSchool: string;
    let teacherClasses: any;
    let classes: any;

    const profile = await Profile.findOne({ teacher: req.teacher._id });

    if (profile) {
      teacherCurrentSchool = profile.selectedSchool;

      teacherClasses = await TeacherClass.find({
        school: teacherCurrentSchool,
      });

      classes = await Promise.all(
        teacherClasses.map(async (e) => {
          const teacherClass = await StudentTeacherClass.find({
            school: teacherCurrentSchool,
            class: e._id
          })

          return {
            class: e,
            numberOfStudents: teacherClass.length
          }
        })
      )
    }

    if (!profile) {
      teacherClasses = await teacherClassService.getAll({
        teacher: req.teacher._id,
      });

      classes = teacherClasses.map((e) => {
        return {
          class: e,
          numberOfStudents: e.students.length
        }
      })
    }

    if (!teacherClasses) {
      throw new NotFoundError("class not found");
    }

    ServerResponse(req, res, 200, classes, "classes fetched sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function createAvatar(req, res) {
  try {
    const teacher = await Teacher.findById(req.teacher._id);
    teacher.avatar = await sharp(req.file.buffer).resize({ width: 180, height: 180 }).png().toBuffer();
    await teacher.save();
    res.send({ message: "successful" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getAvatar(req, res) {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher || !teacher.avatar) return res.status(404).send({ message: "Not Found" });
    res.set("Content-Type", "image/png").send(teacher.avatar);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function createTeacher(req, res) {
  const { error } = validateTeacher(req.body);
  let { name, email, password } = req.body;
  if (error) return res.status(400).send(error.details[0].message);
  const registeredStudent = await Student.findOne({ email });
  if (registeredStudent) return res.status(401).send({ message: "You cannot use same email registered as Student" });
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  let teacher = await Teacher.findOne({ email });
  if (teacher) return res.status(400).send({ message: "Email already Registered" });
  teacher = new Teacher({
    name,
    password,
    email,
  });
  await teacher.save();
  const token = teacher.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(teacher, ["name", "email", "questions", "students", "_id"]));
}

async function updateTeacher(req, res) {
  try {
    const teacher = await Teacher.findById(req.teacher._id);
    if (!teacher) return res.status(404).send({ message: "teacher was not found" });

    const { email, name } = req.body;
    const { error } = validateUpdateTeacher(req.body);

    if (error) return res.status(400).send(error.details[0].message);
    teacher.name = name;
    teacher.email = email;
    await teacher.save();
    res.send(teacher);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function sendQuizToStudents(req, res) {
  const { classId } = req.params;
  let { dueDate, students, questions, startDate } = req.body;

  if (!Array.isArray(students) && !Array.isArray(questions))
    return res.status(400).send({ message: "students and question must be array of objectIds" });

  if (questions.length === 0) return res.status(400).send({ message: "Please add questions to this class" });
  if (students.length === 0) return res.status(400).send({ message: "Please add students to this class" });

  if (startDate) startDate = new Date(startDate);
  else startDate = Date.now;

  try {
    let newQuiz = new QuizClasswork({
      questions,
      students,
      dueDate,
      startDate,
      teacher: req.teacher._id,
      classId,
    });
    newQuiz = await newQuiz.save();

    for (let studentId of students) {
      let student = await Student.findOne({ _id: studentId });
      // classworks.quizClasswork.push(newQuiz._id)
      student = student.addQuiz(newQuiz._id);
      await student.save();
    }

    let teacherClass = await TeacherClass.findOne({ _id: classId });
    teacherClass = teacherClass.publishClass(classId);
    teacherClass.classwork.quiz = [];
    teacherClass = teacherClass.addSentQuiz(newQuiz._id);
    await teacherClass.save();

    let teacher = await Teacher.findOne({ _id: req.teacher._id });
    teacher = teacher.addSentQuizClasswork(newQuiz._id);
    await teacher.save();
    res.send({ message: "Sent!" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function sendLabToStudents(req, res) {
  const { classId } = req.params;
  let { dueDate, students, experiments, startDate } = req.body;

  if (!Array.isArray(students) && !Array.isArray(experiments))
    return res.status(400).send({ message: "students and labs must be array of objectIds" });

  if (experiments.length === 0) return res.status(400).send({ message: "Please add experiment to this class" });
  if (students.length === 0) return res.status(400).send({ message: "Please add students to this class" });

  if (startDate) startDate = new Date(startDate);
  else startDate = Date.now;

  try {
    let newExperiment = new Experiment({
      experiments,
      students,
      dueDate,
      startDate,
      teacher: req.teacher._id,
      classId,
    });
    newExperiment = await newExperiment.save();

    for (let studentId of students) {
      let student = await Student.findOne({ _id: studentId });
      student = student.addLab(newExperiment._id);
      await student.save();
    }

    let teacherClass = await TeacherClass.findOne({ _id: classId });
    teacherClass = teacherClass.publishClass(classId);
    teacherClass.classwork.lab = [];
    teacherClass = teacherClass.addSentLab(newExperiment._id);
    await teacherClass.save();

    let teacher = await Teacher.findOne({ _id: req.teacher._id });
    teacher = teacher.addSentLabClasswork(newExperiment._id);
    await teacher.save();
    res.send({ message: "Sent!" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function sendInviteToStudent(req, res) {
  // const { studentEmail, classId } = req.body
  const { studentEmail } = req.body;
  const { _id } = req.teacher;
  if (!studentEmail) return res.status(400).send({ message: "Please include student Email" });

  try {
    let teacher = await teacherService.getOne({ _id });
    let student = await studentService.findOne({ email: studentEmail });

    // save student in class

    /**
     * Tasks => student should be added from the list of teacher students
     * invite student from a class should be from pool of students
     */
    if (teacher.email === studentEmail) {
      throw new BadRequestError("You can't send invite to yourself");
    }

    if (!student) {
      // teacher = teacher.addUnregisterStudent(studentEmail);
      let generatedPassword = generator.generate({
        length: 5,
        numbers: true,
      });
      const salt = await bcrypt.genSalt(10);
      let password = await bcrypt.hash(generatedPassword, salt);

      const createdStudent = await teacherService.createStudent(
        {
          email: studentEmail,
          password,
          name: "new student",
        },
        _id
      );

      doSendInvitationEmail(createdStudent, teacher, generatedPassword);

      student = createdStudent;
    }

    const isStudent = teacher.checkStudentById(student._id);
    if (isStudent) return res.status(400).send({ message: "Invitation already sent to this student" });

    // add student to class

    // add student to teacher list of students
    teacher = teacher.addStudent(student._id);

    // add teacher to student list
    student = student.addTeacher(teacher._id, "teacher");

    await teacher.save();
    await student.save();
    return res.send({ data: { id: student._id, email: student.email }, message: "Invitation sent!" });
  } catch (ex) {
    ServerErrorHandler(req, res, ex);
  }
}

async function acceptStudentInvite(req, res) {
  const studentId = req.params.studentId;
  try {
    let teacher = await teacherService.getOne({ _id: req.teacher._id });
    let student = await studentService.getOne({ _id: studentId });
    teacher = teacher.acceptStudent(studentId);
    student = student.acceptTeacher(teacher._id);

    await student.save();
    await teacher.save();
    const approved = await studentTeacherService.create(teacher._id, student._id);

    ServerResponse(req, res, 200, approved, "Invite accepted");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getTeacher(req, res) {
  try {
    const teacher = await Teacher.findById(req.params.id).select("-password -avatar");
    if (!teacher) return res.status(404).send({ message: "Teacher with this ID was not found" });
    res.send(teacher);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getStudents(req: Request, res: Response) {
  try {
    const students = await studentTeacherService.getTeacherStudents(req);

    ServerResponse(req, res, 200, students, "student fetched successfully");
    res.send(students);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function getSchools(req, res) {
  try {
    const schools = await teacherService.getSchools(req.teacher._id);

    return ServerResponse(req, res, 200, schools, "schools fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function updateProfile(req, res) {
  try {
    const profile = await teacherProfileService.update(req.teacher._id, req.body);

    return ServerResponse(req, res, 200, profile, "profile updated");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default {
  acceptStudentInvite,
  createAvatar,
  createClass,
  createTeacher,
  deleteStudent,
  getAvatar,
  getClass,
  getStudents,
  getTeacher,
  sendQuizToStudents,
  sendInviteToStudent,
  updateTeacher,
  sendLabToStudents,
  getSchools,
  updateProfile,
  createSchoolClass,
  addSchoolStudentToClass,
  addSchoolStudentToClassInBulk,
};
