import { validateBulkUpdate } from "../../models/studentScore";
import { doValidate } from "../../services/exceptions/validator";
import gradeBookService from "../../services/grade-book/service";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { Request, Response } from "express";

class GradeBookController {
  async getList(req: Request, res: Response) {
    try {
      const grades = await gradeBookService.getAllByClass(req.params.classId);
      ServerResponse(req, res, 200, grades, "grade fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async updateScores(req: Request, res: Response) {
    try {
      doValidate(validateBulkUpdate(req.body));

      await gradeBookService.updateBulk(req.body.scores);

      ServerResponse(req, res, 200, null, "grade updated");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
}

const gradebookController = new GradeBookController();

export { gradebookController };
