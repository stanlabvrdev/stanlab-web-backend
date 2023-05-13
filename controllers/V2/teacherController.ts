import sharp from "sharp";
import bcrypt from "bcryptjs";
import _ from "lodash";
import generator from "generate-password";

import { Teacher, validateTeacher, validateUpdateTeacher } from "../../models/teacher";
import { Student } from "../../models/student";
import { TeacherClass, validateClass } from "../../models/teacherClass";
import QuizClasswork from "../../models/quizClasswork";
import Experiment from "../../models/experiment";
import { doSendInvitationEmail } from "../../services/email";
import { LabExperiment } from "../../models/labAssignment";

import { StudentScore } from "../../models/studentScore";
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";

import studentService from "../../services/student/student.service";
import BadRequestError from "../../services/exceptions/bad-request";

import studentTeacherService from "../../services/teacherClass/teacher-student";
import teacherClassService from "../../services/teacherClass/teacherClass.service";
import teacherService from "../../services/teacher/teacher.service";

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
  const { error } = validateClass(req.body);
  if (error) return res.status(400).send({ message: error.details[0].message });

  try {
    const teacher = await Teacher.findOne({ _id: req.teacher._id });
    let teacherClass = new TeacherClass({
      title,
      subject: subject || null,
      section: subject || null,
      teacher: req.teacher._id,
    });

    teacherClass = await teacherClass.save();
    teacher.classes.push(teacherClass._id);
    await teacher.save();
    res.send(teacherClass);
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getClass(req, res) {
  try {
    const teacherClasses = await teacherClassService.getAll({ teacher: req.teacher._id });

    // if (!teacherClasses) {
    //     throw new NotFoundError("class not found");
    // }

    // let picked = teacherClasses.classes;
    // if (picked.length > 0)
    //     picked = picked.map((cl) => ({
    //         _id: cl._id,
    //         isPublished: cl.isPublished,
    //         title: cl.title,
    //         subject: cl.subject,
    //         section: cl.section,
    //     }));

    ServerResponse(req, res, 200, teacherClasses, "classes successfully fetched");
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
    res.status(400).send({ message: "Invalid ID" });
  }
}

async function getAvatar(req, res) {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher || !teacher.avatar) return res.status(404).send({ message: "Not Found" });
    res.set("Content-Type", "image/png").send(teacher.avatar);
  } catch (error) {
    res.status(400).send({ message: "Invalid ID" });
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
    let teacher = await Teacher.findOne({ _id });
    let student = await Student.findOne({ email: studentEmail });

    // save student in class

    /**
     * Tasks => student should be added from the list of teacher students
     * invite student from a class should be from pool of students
     */
    if (teacher.email === studentEmail) return res.status(400).send({ message: "You can't send invite to yourself" });

    if (!student) {
      // teacher = teacher.addUnregisterStudent(studentEmail);
      let generatedPassword = generator.generate({
        length: 5,
        numbers: true,
      });
      const salt = await bcrypt.genSalt(10);
      let password = await bcrypt.hash(generatedPassword, salt);

      const createdStudent = await studentService.create({
        email: studentEmail,
        password,
        name: "new student",
      });

      // create student

      doSendInvitationEmail(createdStudent, teacher, generatedPassword);

      student = createdStudent;
    }

    const isStudent = teacher.checkStudentById(student._id);
    if (isStudent) throw new BadRequestError("Invitation already sent to this student");

    // add student to class

    // add student to teacher list of students
    teacher = teacher.addStudent(student._id);

    // add teacher to student list
    student = student.addTeacher(teacher._id, "teacher");

    await teacher.save();
    await student.save();
    await studentTeacherService.create(teacher._id, student._id);

    ServerResponse(req, res, 200, { id: student._id, email: student.email }, "Invitation sent!");
  } catch (ex) {
    ServerErrorHandler(req, res, ex);
  }
}

async function acceptStudentInvite(req, res) {
  const studentId = req.params.studentId;
  try {
    let teacher = await Teacher.findOne({ _id: req.teacher._id });
    let student = await Student.findOne({ _id: studentId });
    teacher = teacher.acceptStudent(studentId);
    student = student.acceptTeacher(teacher._id);

    await student.save();
    await teacher.save();
    res.send({ message: "Invite accepted" });
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

async function getStudents(req, res) {
  try {
    const teacher = await Teacher.findOne({ _id: req.teacher._id })
      .populate({
        path: "students.student",
        select: "name email",
      })
      .select("students");

    let students = teacher.students;

    if (students.length > 0) {
      students = students.map((data) => data.student);
    }
    res.send({
      message: "students successfully fetched",
      data: students,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getStudentScores(req, res) {
  const teacherId = req.teacher._id;
  const classId = req.query.classId;

  try {
    const where: any = { teacherId: teacherId };

    if (classId) where.classId = classId;
    const scores = await StudentScore.find(where)
      .populate({ path: "student", select: ["name", "_id", "email"], model: "Student" })
      .populate({ path: "student_class", select: ["title", "subject", "section", "_id"] });

    res.send({ messages: "scores successfully fetched", data: scores });
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
  getStudentScores,
};
