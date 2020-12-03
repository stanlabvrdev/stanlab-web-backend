const express = require("express");
const bcrypt = require("bcryptjs");
const Joi = require("joi");
const { Teacher } = require("../models/teacher");
const { Student } = require("../models/student");

function validateAuth(auth) {
  const schema = Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  });

  return schema.validate(auth);
}

const router = express.Router();

router.post("/teachers", async (req, res) => {
  const { email, password } = req.body;
  const { error } = validateAuth(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const teacher = await Teacher.findOne({ email });
  if (!teacher) return res.status(400).send("Invalid Credentials");

  const isValid = await bcrypt.compare(password, teacher.password);

  if (!isValid) return res.status(400).send("Invalid credentials");
  const token = teacher.generateAuthToken();
  res.send(token);
});

router.post("/students", async (req, res) => {
  const { email, password } = req.body;
  const { error } = validateAuth(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const student = await Student.findOne({ email });
  if (!student) return res.status(400).send("Invalid Credentials");

  const isValid = await bcrypt.compare(password, student.password);

  if (!isValid) return res.status(400).send("Invalid credentials");
  const token = student.generateAuthToken();
  res.send(token);
});
module.exports = router;
