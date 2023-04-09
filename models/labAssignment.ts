import mongoose from "mongoose";
import Joi from "joi";
import { SystemExperiment } from "./systemExperiments";

interface IExperiment
  extends Pick<SystemExperiment, "name" | "icon" | "class" | "subject" | "practicalName" | "demoVideoUrl"> {
  code: string;
  _id: string;
}

export interface CreateLabAssignment {
  due_date: string;
  instruction: string;
  class_id: string;
  teacher_id: string;

  experiment_id: string;

  start_date: string;

  school_id?: string;
  student_id?: string;
}

export interface Filter {
  _id?: string;
  experiment?: IExperiment;
  classId?: string;
  dueDate?: string;

  startDate?: string;
  isCompleted?: boolean;
  student?: string;
  teacher?: string;

  submissionDate?: string;

  grade?: number | null;
  comments?: string | null;
  school?: string | null;
}

export interface ILabExperiment {
  _id?: string;
  experiment: IExperiment;
  classId: string;
  dueDate: string;
  instruction: string;
  startDate: string;
  isCompleted?: boolean;
  student: string;
  teacher: string;

  submissionDate?: string;

  grade?: number | null;
  comments?: string | null;
  school?: string | null;
}

const labExperimentSchema = new mongoose.Schema({
  experiment: {
    type: new mongoose.Schema({
      _id: mongoose.Schema.Types.ObjectId,
      name: {
        type: String,
        trim: true,
      },
      class: { type: String },
      subject: { type: String },
      code: { type: String },
    }),
    required: true,
  },
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
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
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
