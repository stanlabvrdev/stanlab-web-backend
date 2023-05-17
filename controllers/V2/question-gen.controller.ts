import { QuestionGenerator } from "../../services/QuestionGeneration/questionGeneration";
import CustomError from "../../services/exceptions/custom";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";

class QuestionGeneratorControllerClass {
  genFromFile = async (req: Request, res: Response) => {
    try {
      if (!req.file) throw new CustomError(400, "No file uploaded");
      const questions = await QuestionGenerator.genFromFile(req.file.mimetype, req.file.buffer);
      return ServerResponse(req, res, 200, questions, "Questions generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };

  genFromText = async (req: Request, res: Response) => {
    try {
      if (!req.body.text) throw new CustomError(400, "Upload text to generate questions");
      const questions = await QuestionGenerator.genFromText(req.body.text);
      return ServerResponse(req, res, 200, questions, "Questions generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  };
}

const QuestionGeneratorController = new QuestionGeneratorControllerClass();

export { QuestionGeneratorController };
