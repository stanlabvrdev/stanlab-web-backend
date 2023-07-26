import { Request, Response } from "express";
import { ITeacherLessonPlan } from "../../models/teacher.lesson-plan";

export interface ILessonPlanService {
  generateLessonPlan(res: Response, data: { subject: string; topic: string; grade: string }): Promise<void>;
  getLessonPlan(lessonId: string, teacherId: string): Promise<ITeacherLessonPlan>;
  getLessonPlans(teacherId: string): Promise<ITeacherLessonPlan[]>;
  createLessonPlan(teacherId: string, { subject, topic, grade, lessonPlan }: CreateLessonPlan): Promise<ITeacherLessonPlan>;
  updateLessonPlan(lessonId: string, teacherId: string, lessonPlan: string): Promise<ITeacherLessonPlan>;
  deleteLessonPlan(lessonId: string, teacherId: string): Promise<ITeacherLessonPlan>;
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
