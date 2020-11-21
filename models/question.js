const mongoose = require("mongoose");
const Joi = require("joi");

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [
      {
        label: String,
        text: String,
        isCorrect: { type: Boolean, default: false },
      },
    ],
    required: true,
  },
  subject: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
});

function validateQuestion(question) {
  const schema = Joi.object({
    questionText: Joi.string().required(),
    options: Joi.array().required(),
    subject: Joi.string().required(),
    teacher: Joi.objectId().required(),
  });

  return schema.validate(question);
}

const Question = mongoose.model("Question", questionSchema);

module.exports = { Question, validateQuestion };
