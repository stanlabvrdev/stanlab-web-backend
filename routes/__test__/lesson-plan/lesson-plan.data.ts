import { TeacherLessonPlanModel } from "../../../models/teacher.lesson-plan";
import { generateRandomPassage } from "../generated-questions/data";

export const sampleMarkdown = `### Header ${generateRandomPassage()}`;

export const createLessonPlan = async (_id: string) => {
  return await TeacherLessonPlanModel.create({
    teacher: _id,
    subject: "Biology",
    grade: "Grade 9",
    topic: "Pollination",
    lessonPlan: "Sample lesson Plan",
  });
};
