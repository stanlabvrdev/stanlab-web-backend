//This class exposes methods that handle contracts that involve the MCQs - may later be extended to also handle true/false questions when they are available
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";
import { studentMCQInstance } from "../../services/QuestionGeneration/studentMCQ.services";
import { Request, Response } from "express";

class StudentMCQControllerClass {
  private studentMCQService;
  constructor(studentMCQService) {
    this.studentMCQService = studentMCQService;
  }

  getAssignments = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignments = await this.studentMCQService.getAssignments(req);
      ServerResponse(req, res, 200, assignments, "Topical assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignment = await this.studentMCQService.getAssignment(req);
      ServerResponse(req, res, 200, assignment, "Assignment fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  makeSubmission = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignment = await this.studentMCQService.makeSubmission(req);
      ServerResponse(req, res, 200, assignment, "Score saved successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

export const studentMCQController = new StudentMCQControllerClass(studentMCQInstance);
