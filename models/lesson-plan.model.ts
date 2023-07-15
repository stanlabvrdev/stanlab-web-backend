import { model, Document, Schema } from "mongoose";

export interface ILessonPlanModel extends Document {
  teacher: string;
  lessonPlan: string;
  subject: string;
  grade: string;
  topic: string;
}

const LessonPlanSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    lessonPlan: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

export const LessonPlanModel = model<ILessonPlanModel>("LessonPlan", LessonPlanSchema);
