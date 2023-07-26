import { model, Document, Schema } from "mongoose";

export interface IGeneratedPlan extends Document {
  teacher: string;
  lessonPlan: string;
  subject: string;
  grade: string;
  topic: string;
}

const GeneratedLessonPlan = new Schema(
  {
    lessonPlan: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

export const GeneratedLessonPlanModel = model<IGeneratedPlan>("GeneratedLessonPlan", GeneratedLessonPlan);
