import teacherService from "../../services/teacher/teacher.service";
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";
import { Request, Response } from "express";

class TeacherMCQControllerClass {
  private teacherMCQService;
  constructor(teacherMCQService) {
    this.teacherMCQService = teacherMCQService;
  }

  editAssignment = async (req: Request, res: Response) => {
    try {
      const assignment = await this.teacherMCQService.editAssignment(req);
      ServerResponse(req, res, 200, assignment, "Topical assignment updated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  deleteAssignment = async (req: Request, res: Response) => {
    try {
      await this.teacherMCQService.editAssignment(req);
      ServerResponse(req, res, 200, null, "Assignment deleted successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentByClass = async (req: Request, res: Response) => {
    try {
      const assignments = await this.teacherMCQService.getAssignmentByClass(req);
      ServerResponse(req, res, 200, assignments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignment = async (req: Request, res: Response) => {
    try {
      const assigment = await this.teacherMCQService.getAssignment(req);
      ServerResponse(req, res, 200, assigment, "Assignment fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

export const teacherMCQController = new TeacherMCQControllerClass(teacherService);
