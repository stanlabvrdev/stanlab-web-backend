import { model, Document, Schema } from "mongoose";

export interface ITeacherLessonPlan extends Document {
  teacher: string;
  lessonPlan: string;
  subject: string;
  grade: string;
  topic: string;
}

const TeacherLessonPlanSchema = new Schema(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    lessonPlan: { type: String, required: true },
    subject: { type: String, required: true },
    grade: { type: String, required: true },
    topic: { type: String, required: true },
  },
  { timestamps: true }
);

export const TeacherLessonPlanModel = model<ITeacherLessonPlan>("TeacherLessonPlan", TeacherLessonPlanSchema);
