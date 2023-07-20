import { ILessonPlanController } from "../../services/lesson-plan/lesson-plan.types";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";
import { LessonPlanService } from "../../services/lesson-plan/lesson-plan.service";
import { sanitizeMarkdown } from "../../utils/sanitize-markdown";
import { OpenAIService } from "../../services/openai/openai.service";
const lessonPlanService = new LessonPlanService();

export class LessonPlanController implements ILessonPlanController {
  async generateLessonPlan(req: Request, res: Response) {
    try {
      const { subject, grade, topic } = req.body;
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      const response = await lessonPlanService.generateLessonPlan(subject, topic, grade);
      const stream = response.data as unknown as NodeJS.ReadableStream;
      await OpenAIService.handleStream(stream, res);
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async getLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const { Id } = req.params;
      const teacherId = req.teacher._id;
      const lessonPlan = await lessonPlanService.getLessonPlan(Id, teacherId);
      ServerResponse(req, res, 200, lessonPlan, "Lesson Plan Fetched");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async getLessonPlans(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = req.teacher._id;
      const lessonPlans = await lessonPlanService.getLessonPlans(teacherId);
      ServerResponse(req, res, 200, lessonPlans, "Lesson Plans Fetched");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async createLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const sanitizedMarkdown = sanitizeMarkdown(req.body.lessonPlan);
      const teacherId = req.teacher._id;
      const { subject, grade, topic } = req.body;
      const lessonPlan = await lessonPlanService.createLessonPlan(teacherId, { subject, grade, topic, lessonPlan: sanitizedMarkdown });
      ServerResponse(req, res, 200, lessonPlan, "Lesson Plan Created");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async updateLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const { Id } = req.params;
      const teacherId = req.teacher._id;
      const sanitizedMarkdown = sanitizeMarkdown(req.body.lessonPlan);
      const lessonPlan = await lessonPlanService.updateLessonPlan(Id, teacherId, sanitizedMarkdown);
      ServerResponse(req, res, 200, lessonPlan, "Lesson Plan Updated");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async deleteLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const { Id } = req.params;
      const teacherId = req.teacher._id;
      const lessonPlan = await lessonPlanService.deleteLessonPlan(Id, teacherId);
      ServerResponse(req, res, 200, lessonPlan, "Lesson Plan Deleted");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
}
