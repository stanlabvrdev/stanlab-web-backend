const express = require("express");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const multer = require("multer");
const _ = require("lodash");
const {
  Teacher,
  validateTeacher,
  validateUpdateTeacher,
} = require("../models/teacher");
const { Student, validateIDs } = require("../models/student");
const { teacherAuth, studentAuth } = require("../middleware/auth");
const { Question } = require("../models/question");
const router = express.Router();

// get all teachers
router.get("/", studentAuth, async (req, res) => {
  const teachers = await Teacher.find().select("-password");
  res.send(teachers);
});

// get a teacher

// post: Teacher avatar

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload valid image"));
    }
    cb(null, true);
  },
});

router.post(
  "/avatar",
  teacherAuth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const teacher = await Teacher.findById(req.teacher._id);
      teacher.avatar = await sharp(req.file.buffer)
        .resize({ width: 180, height: 180 })
        .png()
        .toBuffer();
      await teacher.save();
      res.send({ message: "successful" });
    } catch (error) {
      res.status(400).send({ message: "Invalid ID" });
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// get teacher avatar
router.get("/:id/avatar", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher || !teacher.avatar)
      return res.status(404).send({ message: "Not Found" });
    res.set("Content-Type", "image/png").send(teacher.avatar);
  } catch (error) {
    res.status(400).send({ message: "Invalid ID" });
  }
});

// create a teacher
router.post("/", async (req, res) => {
  const { error } = validateTeacher(req.body);
  let { name, email, password } = req.body;
  if (error) return res.status(400).send(error.details[0].message);
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  let teacher = await Teacher.findOne({ email });
  if (teacher)
    return res.status(400).send({ message: "Teacher already Registered" });
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
    .send(_.pick(teacher, ["name", "email", "questions", "students"]));
});

// update teacher via email and name
router.put("/", teacherAuth, async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.teacher._id);
    if (!teacher)
      return res.status(404).send({ message: "teacher was not found" });

    const { email, name } = req.body;
    const { error } = validateUpdateTeacher(req.body);

    if (error) return res.status(400).send(error.details[0].message);
    teacher.name = name;
    teacher.email = email;
    await teacher.save();
    res.send(teacher);
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Something went wrong");
  }
});

/* 
post: Add Student Route
*/

// find the student, set isaccepted to true

router.get("/students", teacherAuth, async (req, res) => {
  try {
    const students = await Teacher.find({ _id: req.teacher._id })
      .populate("students", "-__v -password")
      .select("students");
    if (!students) return res.send([]);
    return res.send(students);
  } catch (error) {
    console.log(error.message);
  }
});

// get teacher questions
router.get("/questions", teacherAuth, async (req, res) => {
  const { subject } = req.query;

  if (!subject) return res.status(400).send({ message: "Invalid URL" });
  const questions = await Teacher.find({
    _id: req.teacher._id,
  })
    .populate({ path: "questions", match: { subject, isPublished: false } })
    .select("questions");
  return res.send(questions);
});

// delete a question
router.delete("/questions/:id", teacherAuth, async (req, res) => {
  const questionID = req.params.id;
  const teacherID = req.teacher._id;
  const teacher = await Teacher.findById(teacherID);
  try {
    const question = await Question.findByIdAndRemove(questionID);
    if (!question)
      return res
        .status(404)
        .send({ message: "Question with this ID was not found" });
    const quesIndex = teacher.questions.findIndex(
      (q) => q.toString() === questionID.toString()
    );
    if (!quesIndex)
      return res
        .status(404)
        .send({ message: "Question with this ID was not found" });
    teacher.questions.splice(quesIndex, 1);
    await teacher.save();
    res.send({ message: "Question successfully deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ message: "Invalid Question ID" });
  }
});

router.post("/add-student", teacherAuth, async (req, res) => {
  const { studentID } = req.body;
  try {
    const student = await Student.findById(studentID);
    console.log(student.questions);
    console.log(req.teacher._id);
    if (!student) return res.status(404).send({ message: "Student not found" });
    student.isAccepted = true;
    student.teacher = req.teacher._id;

    await student.save();
    res.send({ message: "student added" });
  } catch (error) {
    console.log(error.message);
    return res.status(400).send({ message: "Invalid student ID" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select(
      "-password -avatar"
    );
    if (!teacher)
      return res
        .status(404)
        .send({ message: "Teacher with this ID was not found" });
    res.send(teacher);
  } catch (error) {
    console.log(error.message);
    res.status(400).send({ message: "Invalid teacher ID" });
  }
});
// Get: all students
module.exports = router;
