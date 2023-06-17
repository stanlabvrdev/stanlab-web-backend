import { teacherMCQService } from "../../services/QuestionGeneration/teacherMCQ.services";
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";
import { Request, Response } from "express";

class TeacherMCQControllerClass {
  editAssignment = async (req: Request, res: Response) => {
    try {
      const assignment = await teacherMCQService.editAssignment(req);
      ServerResponse(req, res, 200, assignment, "Topical assignment updated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  deleteAssignment = async (req: Request, res: Response) => {
    try {
      await teacherMCQService.deleteAssignment(req);
      ServerResponse(req, res, 200, null, "Assignment deleted successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentsAssigned = async (req: Request, res: Response) => {
    try {
      const assigments = await teacherMCQService.getAssignmentsAssigned(req);
      ServerResponse(req, res, 200, assigments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentsCompleted = async (req: Request, res: Response) => {
    try {
      const assigments = await teacherMCQService.getAssignmentsCompleted(req);
      ServerResponse(req, res, 200, assigments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentsUnassigned = async (req: Request, res: Response) => {
    try {
      const assignments = await teacherMCQService.getAsssignmentsUncompleted(req);
      ServerResponse(req, res, 200, assignments, "Assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignment = async (req: Request, res: Response) => {
    try {
      const data = await teacherMCQService.getAssignment(req);
      ServerResponse(req, res, 200, data, "Operation successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

export const teacherMCQController = new TeacherMCQControllerClass();
