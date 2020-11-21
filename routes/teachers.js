const express = require("express");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { Teacher, validateTeacher } = require("../models/teacher");
const router = express.Router();

// , questions,students
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
    .send(_.pick(teacher, ["name", "email", "questions", "students"]));
});

module.exports = router;
