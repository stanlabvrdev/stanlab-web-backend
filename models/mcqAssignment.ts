import mongoose, { Schema, Document, Model } from "mongoose";

export interface StudentWork extends Document {
  student: Schema.Types.ObjectId;
  scores: {
    score: number;
    date: Date;
  }[];
}

export interface MCQAssignment extends Document {
  questions: Schema.Types.ObjectId;
  classId: Schema.Types.ObjectId;
  startDate: Date;
  dueDate: Date;
  duration?: number;
  instruction?: string;
  type: "Practice" | "Test";
  teacher: Schema.Types.ObjectId;
  comments?: string;
  students: StudentWork[];
  school?: Schema.Types.ObjectId;
}

//schema for scores since I plan on scores to be an embedded document within the mcq assignment schema
const studentsWork: Schema<StudentWork> = new mongoose.Schema({
  student: { type: Schema.Types.ObjectId, ref: "Student" },
  scores: [
    {
      score: Number,
      date: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});

//This model is the student's copy of the assignment
const mcqAssignmentSchema: Schema<MCQAssignment> = new mongoose.Schema({
  questions: {
    type: Schema.Types.ObjectId,
    ref: "QuestionGroup",
  },
  classId: {
    type: Schema.Types.ObjectId,
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
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "Teacher",
  },
  comments: {
    type: String,
  },
  students: [studentsWork],
  school: {
    type: Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
});

const mcqAssignment: Model<MCQAssignment> = mongoose.model<MCQAssignment>("mcqAssignment", mcqAssignmentSchema);

export default mcqAssignment;
