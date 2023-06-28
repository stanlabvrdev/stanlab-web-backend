import mongoose from "mongoose";
import Joi from "joi";

export interface IStudentScore {
  classId: mongoose.Types.ObjectId;
  experimentId?: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  score?: number;
  isCompleted?: boolean;
  school?: mongoose.Types.ObjectId;
}

const studentScoreSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherClass",
    },
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "LabExperiment" },
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: "mcqAssignment" },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    score: { type: Number },
    isCompleted: { type: Boolean, default: false },
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
    },
  },
  { toJSON: { virtuals: true } }
);

studentScoreSchema.virtual("student", {
  ref: "Student", // the collection/model name
  localField: "studentId",
  foreignField: "_id",
  justOne: true, // default is false
});
studentScoreSchema.virtual("student_class", {
  ref: "TeacherClass", // the collection/model name
  localField: "classId",
  foreignField: "_id",
  justOne: true, // default is false
});
studentScoreSchema.virtual("lab", {
  ref: "LabExperiment", // the collection/model name
  localField: "experimentId",
  foreignField: "_id",
  justOne: true, // default is false
});

function validateClass(classObj) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(50).required(),
    subject: Joi.string().required(),
    section: Joi.string(),
    classwork: Joi.object(),
  });
  return schema.validate(classObj);
}

function validateBulkUpdate(data) {
  let scoreProp = Joi.object().keys({
    id: Joi.string().required(),
    score: Joi.number().required(),
  });

  const schema = Joi.object({
    scores: Joi.array().items(scoreProp).required(),
  });

  return schema.validate(data);
}

const StudentScore = mongoose.model("StudentScore", studentScoreSchema);

export { StudentScore, validateClass, validateBulkUpdate };
