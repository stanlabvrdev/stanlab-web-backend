import { Request, Response } from "express";
import { ILessonPlanModel } from "../../models/lesson-plan.model";
import { AxiosResponse } from "axios";
import { CreateChatCompletionResponse } from "openai";

export interface ILessonPlanService {
  generateLessonPlan(subject: string, topic: string, grade: string): Promise<AxiosResponse<CreateChatCompletionResponse, any>>;
  getLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel>;
  getLessonPlans(teacherId: string): Promise<ILessonPlanModel[]>;
  createLessonPlan(teacherId: string, { subject, topic, grade, lessonPlan }: CreateLessonPlan): Promise<ILessonPlanModel>;
  updateLessonPlan(lessonId: string, teacherId: string, lessonPlan: string): Promise<ILessonPlanModel>;
  deleteLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel>;
}
export type CreateLessonPlan = { subject: string; topic: string; grade: string; lessonPlan: string };

export interface ILessonPlanController {
  generateLessonPlan(req: Request, res: Response): Promise<void>;
  getLessonPlan(req: Request, res: Response): Promise<void>;
  getLessonPlans(req: Request, res: Response): Promise<void>;
  createLessonPlan(req: Request, res: Response): Promise<void>;
  updateLessonPlan(req: Request, res: Response): Promise<void>;
  deleteLessonPlan(req: Request, res: Response): Promise<void>;
}
