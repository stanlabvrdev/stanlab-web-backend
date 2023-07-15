import { ILessonPlanModel, LessonPlanModel } from "../../models/lesson-plan.model";
import NotFoundError from "../exceptions/not-found";
import { ILessonPlanService } from "./lesson-plan.types";
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

  async createLessonPlan(): Promise<ILessonPlanModel> {
    return await LessonPlanModel.create({});
  }

  async updateLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel> {
    const lessonPlan = await LessonPlanModel.findOneAndUpdate({ _id: lessonId, teacher: teacherId }, {}, { new: true }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }

  async deleteLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel> {
    const lessonPlan = await LessonPlanModel.findOneAndDelete({ _id: lessonId, teacher: teacherId }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }
}

//TODO : Middleware to validate request body for post requests and check that ID is valid for requests expecting an ID
//TODO: Create dtos, interfaces and finish up model
