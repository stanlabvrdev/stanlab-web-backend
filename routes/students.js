const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { studentAuth } = require("../middleware/auth");
const { Student, validateStudent, validateIDs } = require("../models/student");
const { Teacher } = require("../models/teacher");
const router = express.Router();

/*
Post: Register a new Student
*/

router.post("/", async (req, res) => {
  const { error } = validateStudent(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let { name, email, password, studentClass, teacher } = req.body;
  let student = await Student.findOne({ email });
  if (student) return res.status(400).send("Student already registered");
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  student = new Student({
    name,
    email,
    password,
    studentClass,
    teacher,
  });
  await student.save();
  res.send(_.pick(student, ["name", "email", "studentClass", "teacher"]));
});

// send request to teacher
router.post("/request-teacher/teacherId", studentAuth, async (req, res) => {
  const teacherID = req.params.teacherID;
  const studentID = req.student._id;
  const { error } = validateIDs({ teacherID });
  if (error) return res.status(400).send(error.details[0].message);
  const student = await Student.findById(studentID);
  if (student.teacher.toString() === studentID.toString())
    return res.status(400).send("Teacher already added");
  student.teacher = teacherID;
  await student.save();
  res.send(_.pick(student, ["name", "email", "teacher", "studentClass"]));
});

// Send add request to a teacher

router.post("/add-request", studentAuth, async (req, res) => {
  const { teacherID } = req.body;
  const studentID = req.student._id;
  try {
    const teacher = await Teacher.findById(teacherID);
    let student = teacher.students.find(
      (s) => s.toString() === studentID.toString()
    );
    if (student)
      return res.status(409).send({ message: "Student already exist" });
    teacher.students.push(studentID);
    await teacher.save();
    res.send({ message: "request sent" });
  } catch (error) {
    res.status(400).send({ message: "Invalid teacher ID" });
  }
});

module.exports = router;
