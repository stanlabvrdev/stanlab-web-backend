import { QuestionGenerator } from "../../services/QuestionGeneration/questionGeneration";
import { GeneratedQuestionService } from "../../services/QuestionGeneration/generated-question-service";
import CustomError from "../../services/exceptions/custom";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";

interface ExtendedRequest extends Request {
  file: any;
  teacher: any;
}

class QuestionGeneratorControllerClass {
  private GeneratedQuestionService;
  private QuestionGenerator;

  constructor(GeneratedQuestionService, QuestionGenerator) {
    this.GeneratedQuestionService = GeneratedQuestionService;
    this.QuestionGenerator = QuestionGenerator;
  }

  genFromFile = async (req: Request, res: Response) => {
    const extendedReq = req as ExtendedRequest;
    try {
      if (!extendedReq.file) throw new CustomError(400, "No file uploaded");
      const questions = await this.QuestionGenerator.genFromFile(extendedReq.file.mimetype, extendedReq.file.buffer);
      return ServerResponse(extendedReq, res, 200, questions, "Questions generated successfully");
    } catch (err) {
      ServerErrorHandler(extendedReq, res, err);
    }
  };

  genFromText = async (req: Request, res: Response) => {
    try {
      if (!req.body.text) throw new CustomError(400, "Upload text to generate questions");
      const questions = await this.QuestionGenerator.genFromText(req.body.text);
      return ServerResponse(req, res, 200, questions, "Questions generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  saveQuestions = async (req: Request, res: Response) => {
    try {
      const questGroup = await this.GeneratedQuestionService.saveQuestions(req);
      return ServerResponse(req, res, 200, questGroup, "Questions saved to 'Question bank'");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  editAQuestionGroup = async (req: Request, res: Response) => {
    try {
      const updatedGroup = await this.GeneratedQuestionService.editQuestionGroup(req);
      return ServerResponse(req, res, 200, updatedGroup, "Update successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  getQuestions = async (req: Request, res: Response) => {
    const extendedReq = req as ExtendedRequest;
    try {
      const questions = await this.GeneratedQuestionService.getQuestions(extendedReq.teacher._id);
      return ServerResponse(extendedReq, res, 200, questions, "Successful");
    } catch (err) {
      ServerErrorHandler(extendedReq, res, err);
    }
  };

  getAQuestion = async (req: Request, res: Response) => {
    const extendedReq = req as ExtendedRequest;
    try {
      const data = await this.GeneratedQuestionService.getAQuestionGroup(extendedReq.params.id, extendedReq.teacher._id);
      return ServerResponse(extendedReq, res, data.code, data.data, data.message);
    } catch (err) {
      ServerErrorHandler(extendedReq, res, err);
    }
  };

  deleteQuestionGroup = async (req: Request, res: Response) => {
    try {
      const data = await this.GeneratedQuestionService.deleteQuestionGroup(req.params.id);
      return ServerResponse(req, res, data.code, null, data.message);
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  assignNow = async (req: Request, res: Response) => {
    try {
      const assignment = await this.GeneratedQuestionService.assignNow(req);
      return ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  assignLater = async (req: Request, res: Response) => {
    try {
      const assignment = await this.GeneratedQuestionService.assignLater(req);
      return ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  addImage = async (req: Request, res: Response) => {
    try {
      const extendedReq = req as ExtendedRequest;
      if (!extendedReq.file) throw new CustomError(400, "No, Image uploaded");
      const imageURL = await this.GeneratedQuestionService.addImageToQuestion(req);
      return ServerResponse(req, res, 200, imageURL, "Image added successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

const QuestionGeneratorController = new QuestionGeneratorControllerClass(GeneratedQuestionService, QuestionGenerator);

export { QuestionGeneratorController };
