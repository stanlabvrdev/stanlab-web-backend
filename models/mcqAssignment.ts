import mongoose, { Schema, Document, Model } from "mongoose";
import { GeneratedQuestion } from "./generated-questions";

export interface StudentWork extends Document {
  student: Schema.Types.ObjectId;
  scores: { score: number; date: Date }[];
}

export interface MCQAssignment extends Document {
  questions: Schema.Types.ObjectId | undefined | GeneratedQuestion[];
  classId: string;
  startDate: Date;
  dueDate: Date;
  duration?: number;
  instruction?: string;
  type: "Practice" | "Test";
  teacher: Schema.Types.ObjectId;
  comments?: string;
  students: StudentWork[] | undefined;
  school?: Schema.Types.ObjectId;
  subject: string;
  topic: string;
}

//schema for scores since I plan on scores to be an embedded document within the mcq assignment schema
const studentsWork: Schema<StudentWork> = new mongoose.Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student" },
  scores: [{ score: Number, date: { type: Date, default: Date.now() } }],
});

//To store questions for each
const questionSchema = new mongoose.Schema({
  question: { type: String },
  image: String,
  options: { type: [{ answer: String, isCorrect: { type: Boolean, default: false } }], required: true },
  type: { type: String, required: [true, "Questions must have a type"], enum: ["MCQ", "TOF"] },
});

//This model is the student's copy of the assignment
const mcqAssignmentSchema: Schema<MCQAssignment> = new mongoose.Schema({
  questions: {
    type: [questionSchema],
    validate: {
      validator: function (questions: any[]) {
        return questions.length > 0;
      },
    },
    message: "Assignments must have atleast one question",
  },
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  classId: { type: Schema.Types.ObjectId, ref: "TeacherClass" },
  startDate: Date,
  dueDate: Date,
  duration: Number,
  instruction: String,
  type: { type: String, enum: ["Practice", "Test"], default: "Practice" },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher" },
  comments: String,
  students: [studentsWork],
  school: { type: Schema.Types.ObjectId, ref: "SchoolAdmin" },
});

const mcqAssignment: Model<MCQAssignment> = mongoose.model<MCQAssignment>("mcqAssignment", mcqAssignmentSchema);

export default mcqAssignment;
