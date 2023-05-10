import { AssignmentService } from "../../services/QuestionGeneration/assignmentService";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";

class AssignmentControllerClass {
  private AssignmentService;

  constructor(assignmentService) {
    this.AssignmentService = assignmentService;
  }
  assignNow = async (req: Request, res: Response) => {
    try {
      const assignment = await this.AssignmentService.assignNow(req);
      return ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  assignLater = async (req: Request, res: Response) => {
    try {
      const assignment = await this.AssignmentService.assignLater(req);
      return ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

const AssignmentController = new AssignmentControllerClass(AssignmentService);

export { AssignmentController };
