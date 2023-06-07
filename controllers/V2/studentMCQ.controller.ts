//This class exposes methods that handle contracts that involve the MCQs - may later be extended to also handle true/false questions when they are available
import { ServerResponse, ServerErrorHandler } from "../../services/response/serverResponse";
import { studentMCQInstance } from "../../services/QuestionGeneration/studentMCQ.services";
import { Request, Response } from "express";

class StudentMCQControllerClass {
  getAssignments = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignments = await studentMCQInstance.getAssignments(req);
      ServerResponse(req, res, 200, assignments, "Topical assignments fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignment = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignment = await studentMCQInstance.getAssignment(req);
      ServerResponse(req, res, 200, assignment, "Assignment fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  makeSubmission = async (req: Request, res: Response): Promise<any> => {
    try {
      const assignment = await studentMCQInstance.makeSubmission(req);
      ServerResponse(req, res, 200, assignment, "Score saved successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getAssignmentScoresByClass = async (req: Request, res: Response): Promise<any> => {
    try {
      const score = await studentMCQInstance.getAssignmentScoresByClass(req);
      ServerResponse(req, res, 200, score, "Score fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

export const studentMCQController = new StudentMCQControllerClass();
