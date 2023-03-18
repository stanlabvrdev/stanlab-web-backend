import mongoose from "mongoose";
import Joi from "joi";

//schema for scores since I plan on scores to be an embedded document within the mcq assignment schema
const score = new mongoose.Schema({
  score: Number,
  date: {
    type: Date,
    default: Date.now(),
  },
});

//This model is the student's copy of the assignment
const studentMCQSchema = new mongoose.Schema({
  questions: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuestionGroup",
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TeacherClass",
  },
  startDate: Date,
  dueDate: Date,
  instruction: {
    type: String,
  },
  type: {
    type: String,
    enum: ["Practice", "Test"],
    default: "Practice",
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
  teacherAssignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "teacherMCQ",
    required: true,
  },
  grade: {
    type: Number, // I ain't sure if this should be a number or a string
  },
  comments: {
    type: String,
  },
  scores: {
    type: [score],
    default: [],
  },
});

const studentMCQ = mongoose.model("studentMCQ", studentMCQSchema);

export default studentMCQ;
