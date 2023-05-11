import { teacherMCQService } from "../../services/QuestionGeneration/teacherMCQ.services";
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
      await this.teacherMCQService.deleteAssignment(req);
      ServerResponse(req, res, 200, null, "Assignment deleted successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentAssigned = async (req: Request, res: Response) => {
    try {
      const assigments = await this.teacherMCQService.getAssignmentAssigned(req);
      ServerResponse(req, res, 200, assigments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentCompleted = async (req: Request, res: Response) => {
    try {
      const assigments = await this.teacherMCQService.getAssignmentCompleted(req);
      ServerResponse(req, res, 200, assigments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignment = async (req: Request, res: Response) => {
    try {
      const data = await this.teacherMCQService.getAssignment(req);
      ServerResponse(req, res, 200, data, "Operation successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

export const teacherMCQController = new TeacherMCQControllerClass(teacherMCQService);
