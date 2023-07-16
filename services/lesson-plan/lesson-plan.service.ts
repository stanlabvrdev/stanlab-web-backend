import { ILessonPlanModel, LessonPlanModel } from "../../models/lesson-plan.model";
import NotFoundError from "../exceptions/not-found";
import { CreateLessonPlan, ILessonPlanService } from "./lesson-plan.types";
import { OpenAIService } from "../openai/openai.service";

export class LessonPlanService implements ILessonPlanService {
  async generateLessonPlan() {}

  async getLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel> {
    const lessonPlan = await LessonPlanModel.findOne({ _id: lessonId, teacher: teacherId }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }

  async getLessonPlans(teacherId: string): Promise<ILessonPlanModel[]> {
    return await LessonPlanModel.find({ teacher: teacherId }).exec();
  }

  async createLessonPlan(teacherId: string, { subject, grade, topic, lessonPlan }: CreateLessonPlan): Promise<ILessonPlanModel> {
    return await LessonPlanModel.create({
      teacher: teacherId,
      subject,
      grade,
      lessonPlan,
      topic,
    });
  }

  async updateLessonPlan(lessonId: string, teacherId: string, updatedLessonPlan: string): Promise<ILessonPlanModel> {
    const lessonPlan = await LessonPlanModel.findOneAndUpdate({ _id: lessonId, teacher: teacherId }, { updatedLessonPlan }, { new: true }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }

  async deleteLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel> {
    const lessonPlan = await LessonPlanModel.findOneAndDelete({ _id: lessonId, teacher: teacherId }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }
}
