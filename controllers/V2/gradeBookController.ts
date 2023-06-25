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

  async getTopicalAssignmentGradesByClass(req: Request, res: Response): Promise<any> {
    try {
      const data = await gradeBookService.getTopicalAssignmentGradesByClass(req.params.classId, req.teacher._id);
      ServerResponse(req, res, 200, data, "GradeBook Data successfully fetched");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
}

const gradebookController = new GradeBookController();

export { gradebookController };
