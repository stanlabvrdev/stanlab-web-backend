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

import studentService from "./student/student.service";

async function doInviteStudent(req, res) {
  // const { studentEmail, classId } = req.body
  const { studentEmail } = req.body;
  const { _id } = req.teacher;

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
  if (isStudent) return res.status(400).send({ message: "Invitation already sent to this student" });

  // add student to class

  // add student to teacher list of students
  teacher = teacher.addStudent(student._id);

  // add teacher to student list
  student = student.addTeacher(teacher._id, "teacher");

  await teacher.save();
  await student.save();

  return { teacher, student };
}

export { doInviteStudent };
