import { Request, Response } from "express";
import { ILessonPlanModel } from "../../models/lesson-plan.model";

export interface ILessonPlanService {
  generateLessonPlan(): Promise<void>;
  getLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel>;
  getLessonPlans(teacherId: string): Promise<ILessonPlanModel[]>;
  createLessonPlan(): Promise<ILessonPlanModel>;
  updateLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel>;
  deleteLessonPlan(lessonId: string, teacherId: string): Promise<ILessonPlanModel>;
}

export interface ILessonPlanController {
  generateLessonPlan(req: Request, res: Response): Promise<void>;
  getLessonPlan(req: Request, res: Response): Promise<void>;
  getLessonPlans(req: Request, res: Response): Promise<void>;
  createLessonPlan(req: Request, res: Response): Promise<void>;
  updateLessonPlan(req: Request, res: Response): Promise<void>;
  deleteLessonPlan(req: Request, res: Response): Promise<void>;
}
