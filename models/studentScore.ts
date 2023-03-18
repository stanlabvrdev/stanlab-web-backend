import mongoose from "mongoose";
import Joi from "joi";

const studentScoreSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherClass",
    },
    experimentId: { type: mongoose.Schema.Types.ObjectId, ref: "LabExperiment" },
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

const StudentScore = mongoose.model("StudentScore", studentScoreSchema);

export { StudentScore, validateClass };
