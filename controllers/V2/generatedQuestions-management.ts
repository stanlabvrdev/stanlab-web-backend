import { GeneratedQuestionManagementService } from "../../services/QuestionGeneration/generated-question-service";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";

interface ExtendedRequest extends Request {
  teacher: any;
}

class GeneratedQuestionManagementControllerClass {
  private GeneratedQuestionManagementService;

  constructor(GeneratedQuestionManagementService) {
    this.GeneratedQuestionManagementService = GeneratedQuestionManagementService;
  }

  saveQuestions = async (req: Request, res: Response) => {
    try {
      const questGroup = await this.GeneratedQuestionManagementService.saveQuestions(req);
      return ServerResponse(req, res, 200, questGroup, "Questions saved to 'Question bank'");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  editAQuestionGroup = async (req: Request, res: Response) => {
    try {
      const updatedGroup = await this.GeneratedQuestionManagementService.editQuestionGroup(req);
      return ServerResponse(req, res, 200, updatedGroup, "Update successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getQuestions = async (req: Request, res: Response) => {
    const extendedReq = req as ExtendedRequest;
    try {
      const questions = await this.GeneratedQuestionManagementService.getQuestions(extendedReq.teacher._id);
      return ServerResponse(extendedReq, res, 200, questions, "Successful");
    } catch (err) {
      ServerErrorHandler(extendedReq, res, err);
    }
  };

  getAQuestion = async (req: Request, res: Response) => {
    const extendedReq = req as ExtendedRequest;
    try {
      const data = await this.GeneratedQuestionManagementService.getAQuestionGroup(extendedReq.params.id, extendedReq.teacher._id);
      return ServerResponse(extendedReq, res, data.code, data.data, data.message);
    } catch (err) {
      ServerErrorHandler(extendedReq, res, err);
    }
  };

  deleteQuestionGroup = async (req: Request, res: Response) => {
    try {
      const data = await this.GeneratedQuestionManagementService.deleteQuestionGroup(req.params.id);
      return ServerResponse(req, res, data.code, null, data.message);
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  addImage = async (req: Request, res: Response) => {
    try {
      const imageURL = await this.GeneratedQuestionManagementService.addImageToQuestion(req);
      return ServerResponse(req, res, 200, imageURL, "Image added successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

const GeneratedQuestionManagementController = new GeneratedQuestionManagementControllerClass(GeneratedQuestionManagementService);

export { GeneratedQuestionManagementController };
