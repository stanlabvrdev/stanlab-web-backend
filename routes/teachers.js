const express = require("express");
const bcrypt = require("bcryptjs");
const sharp = require("sharp");
const multer = require("multer");
const _ = require("lodash");
const { Teacher, validateTeacher } = require("../models/teacher");
const { Student } = require("../models/student");
const { teacherAuth, studentAuth } = require("../middleware/auth");
const router = express.Router();

// get a teacher
router.get("/", studentAuth, async (req, res) => {
  const teachers = await Teacher.find().select("-password");
  res.send(teachers);
});

router.get("/:id", async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select(
      "-password -avatar"
    );
    if (!teacher)
      return res.status(404).send("Teacher with this ID was not found");
    res.send(teacher);
  } catch (error) {
    console.log(error.message);
    res.status(400).send("Invalid teacher ID");
  }
});

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
      res.status(400).send("Invalid ID");
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
    console.log(teacher);
    if (!teacher || !teacher.avatar) return res.status(404).send("Not Found");
    res.set("Content-Type", "image/png").send(teacher.avatar);
  } catch (error) {
    res.status(400).send("Invalid ID");
  }
});

// post, questions,students
router.post("/", async (req, res) => {
  const { error } = validateTeacher(req.body);
  let { name, email, password } = req.body;
  if (error) return res.status(400).send(error.details[0].message);
  const salt = await bcrypt.genSalt(10);
  password = await bcrypt.hash(password, salt);
  let teacher = await Teacher.findOne({ email });
  if (teacher) return res.status(400).send("Teacher already Registered");
  teacher = new Teacher({
    name,
    password,
    email,
    questions: [],
    students: [],
  });

  await teacher.save();
  const token = teacher.generateAuthToken();
  res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(_.pick(teacher, ["name", "email", "questions", "students"]));
});

/* 
Add Student Route
*/

router.post("/add-student/:id", teacherAuth, async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) res.status(404).send("Invalid Student ID");
  const teacherID = req.teacher._id;
  try {
    const teacher = await Teacher.findById(teacherID);
    teacher.students.push(
      _.pick(student, ["name", "_id", "email", "studentClass"])
    );
    await teacher.save();
    student.teacher = teacherID;
    await student.save();
    res.send(teacher);
  } catch (error) {
    res.status(500).send("Something went wrong");
    console.log(error.message);
  }
});
module.exports = router;
