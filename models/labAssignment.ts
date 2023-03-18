import mongoose from "mongoose";
import Joi from "joi";

const labExperimentSchema = new mongoose.Schema({
  experiment: { type: mongoose.Schema.Types.ObjectId, ref: "SystemExperiment" },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherClass" },
  dueDate: { type: Date },
  instruction: { type: String },
  startDate: { type: Date, default: Date.now },
  isCompleted: { type: Boolean, default: false },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },

  submissionDate: {
    type: Date,
  },

  grade: {
    type: Number,
  },
  comments: {
    type: String,
  },
});

export function validateAssignment(assignnment) {
  const schema = Joi.object({
    due_date: Joi.date().required(),
    start_date: Joi.date(),
    instruction: Joi.string().required(),
    class_id: Joi.string().required(),
  });

  return schema.validate(assignnment);
}

export function validateGetQuery(data) {
  const schema = Joi.object({
    is_completed: Joi.boolean(),
  });

  return schema.validate(data);
}

export const LabExperiment = mongoose.model("LabExperiment", labExperimentSchema);
