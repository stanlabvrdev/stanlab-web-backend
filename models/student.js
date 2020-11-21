const mongoose = require("mongoose");
const Joi = require("joi");

// profile:snapshot of the student
const studentSchema = new mongoose.Schema({
  name: { type: String, minlength: 5, maxlength: 255, required: true },
  email: {
    type: String,
    minlength: 5,
    maxlength: 255,
    required: true,
    unique: true,
  },
  password: { type: String, minlength: 5, maxlength: 1024, required: true },
  class: { type: String },
  role: { type: String, default: "Student" },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
});

function validateStudent(student) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(255).required(),
    email: Joi.string().min(5).max(255).email().required(),
    password: Joi.string().min(5).max(255),
    class: Joi.string(),
    role: Joi.string(),
    teacher: Joi.objectId(),
  });

  return schema.validate(student);
}

const Student = mongoose.model("Student", studentSchema);
module.exports = { Student, validateStudent };
