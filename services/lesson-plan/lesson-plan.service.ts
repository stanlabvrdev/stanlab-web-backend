import { GeneratedLessonPlanModel } from "../../models/generated.lesson-plan";
import { Response } from "express";
import { TeacherLessonPlanModel, ITeacherLessonPlan } from "../../models/teacher.lesson-plan";
import NotFoundError from "../exceptions/not-found";
import { CreateLessonPlan, ILessonPlanService } from "./lesson-plan.types";
import { OpenAIService } from "../openai/openai.service";
import { constructPrompt } from "./lesson-plan.prompt";
import { streamResponse } from "../../utils/streamResponse";

export class LessonPlanService implements ILessonPlanService {
  async generateLessonPlan(res: Response, data: { subject: string; topic: string; grade: string }): Promise<void> {
    const existing = await GeneratedLessonPlanModel.findOne({ ...data });
    if (existing) {
      streamResponse(existing.lessonPlan, res);
      return;
    }
    const prompt = constructPrompt(data.subject, data.grade, data.topic);
    const response = await OpenAIService.createCompletion(prompt);
    const lessonPlan = await OpenAIService.handleStream(response.data as unknown as NodeJS.ReadableStream, res);
    await GeneratedLessonPlanModel.create({ lessonPlan, ...data });
  }

  async getLessonPlan(lessonId: string, teacherId: string): Promise<ITeacherLessonPlan> {
    const lessonPlan = await TeacherLessonPlanModel.findOne({ _id: lessonId, teacher: teacherId }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }

  async getLessonPlans(teacherId: string): Promise<ITeacherLessonPlan[]> {
    return await TeacherLessonPlanModel.find({ teacher: teacherId }).exec();
  }

  async createLessonPlan(teacherId: string, { subject, grade, topic, lessonPlan }: CreateLessonPlan): Promise<ITeacherLessonPlan> {
    return await TeacherLessonPlanModel.create({
      teacher: teacherId,
      subject,
      grade,
      lessonPlan,
      topic,
    });
  }

  async updateLessonPlan(lessonId: string, teacherId: string, updatedLessonPlan: string): Promise<ITeacherLessonPlan> {
    const lessonPlan = await TeacherLessonPlanModel.findOneAndUpdate({ _id: lessonId, teacher: teacherId }, { lessonPlan: updatedLessonPlan }, { new: true }).exec();
    if (!lessonPlan) throw new NotFoundError("Lesson plan not found!");
    return lessonPlan;
  }

  async deleteLessonPlan(lessonIds: string[], teacherId: string): Promise<void> {
    await TeacherLessonPlanModel.deleteMany({
      _id: { $in: lessonIds },
      teacher: teacherId,
    });
    return;
  }
}
