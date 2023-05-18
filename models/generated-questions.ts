//This model is for questions generated through the question gen endpoint
import mongoose from "mongoose";

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
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const GeneratedQuestions = mongoose.model("GeneratedQuestion", questionSchema);

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

const QuestionGroup = mongoose.model("QuestionGroup", questionGroupSchema);

export { QuestionGroup, GeneratedQuestions };
