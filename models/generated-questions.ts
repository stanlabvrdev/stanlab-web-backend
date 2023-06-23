//This model is for questions generated through the question gen endpoint
import mongoose, { Model } from "mongoose";

export interface GeneratedQuestion extends Document {
  _id: string;
  question?: string;
  image?: string;
  draft: Boolean;
  options: {
    _id: string;
    answer: string;
    isCorrect?: boolean;
  }[];
  type: "MCQ" | "TOF";
  createdAt?: Date;
}

export interface QuestionGroup extends Document {
  teacher: string;
  subject: string;
  topic: string;
  school?: string;
  questions: GeneratedQuestion[];
}

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
  },
  image: String,
  options: {
    type: [
      {
        answer: String,
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    required: true,
  },
  draft: {
    type: Boolean,
    default: true,
    required: true,
  },
  type: {
    type: String,
    required: [true, "Questions should have types"],
    enum: ["MCQ", "TOF"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const GeneratedQuestions: Model<GeneratedQuestion> = mongoose.model<GeneratedQuestion>("GeneratedQuestion", questionSchema);

const questionGroupSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  questions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GeneratedQuestion",
    },
  ],
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
});

const QuestionGroup: Model<QuestionGroup> = mongoose.model<QuestionGroup>("QuestionGroup", questionGroupSchema);

export { QuestionGroup, GeneratedQuestions };
