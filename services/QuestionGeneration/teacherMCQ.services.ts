import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import mcqAssignment from "../../models/mcqAssignment";

interface ExtendedRequest extends Request {
  teacher: any;
}

class TeacherMCQStudentClass {
  private mcqAssignmentModel;

  constructor(mcqAssignmentModel) {
    this.mcqAssignmentModel = mcqAssignmentModel;
  }

  async editAssignment(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { id } = extendedReq.params;
    const assignment = await this.mcqAssignmentModel
      .findOneAndUpdate(
        {
          teacher: extendedReq.teacher._id,
          _id: id,
        },
        {
          startDate: req.body.startDate,
          dueDate: req.body.dueDate,
          instruction: req.body.instruction,
          type: req.body.type,
          comments: req.body.comments,
          questions: req.body.questions,
        },
        {
          runValidators: true,
          new: true,
        }
      )
      .select("--__v -students");
    if (!assignment) throw new NotFoundError("Assignment not found");
    return assignment;
  }

  async deleteAssignment(req: Request): Promise<void> {
    const extendedReq = req as ExtendedRequest;
    const { id } = extendedReq.params;

    const assignment = await this.mcqAssignmentModel.findOneAndDelete({
      teacher: extendedReq.teacher._id,
      _id: id,
    });
    if (!assignment) throw new NotFoundError("Assignment not found");
    return;
  }

  private async getAssignmentsByQuery(query: object) {
    const assignments = await this.mcqAssignmentModel.find(query).select("-__v -students, -questions");
    if (assignments.length < 1) throw new NotFoundError("Assignments not found");
    const currentDate = Date.now();
    const formattedAssignments = assignments.reduce(
      (acc, assignment) => {
        assignment.students = undefined;
        if (assignment.dueDate > currentDate) acc.pending.push(assignment);
        else acc.expired.push(assignment);
        return acc;
      },
      {
        pending: [],
        expired: [],
      }
    );
    return formattedAssignments;
  }

  async getAssignments(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const formattedAssignments = await this.getAssignmentsByQuery({ teacher: extendedReq.teacher._id });
    return formattedAssignments;
  }

  async getAssignmentsByClass(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { classID } = req.params;
    const formattedAssignments = await this.getAssignmentsByQuery({ teacher: extendedReq.teacher._id, classId: classID });
    return formattedAssignments;
  }
}

export const teacherMCQService = new TeacherMCQStudentClass(mcqAssignment);
