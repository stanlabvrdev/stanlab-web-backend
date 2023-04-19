import mongoose from "mongoose";

//This model holds the teacher's copy of the assignment - will be used for things like tracking student's submission and assignment history of a teacher
const teacherMCQschema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
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
  duration: Number,
  instruction: {
    type: String,
  },
  type: {
    type: String,
    enum: ["Practice", "Test"],
    default: "Practice",
  },
  studentsWork: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "studentMCQ",
    },
  ],
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
});

const teacherMCQ = mongoose.model("teacherMCQ", teacherMCQschema);

export default teacherMCQ;
