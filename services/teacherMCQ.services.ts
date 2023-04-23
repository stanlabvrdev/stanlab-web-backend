import { Request } from "express";
import NotFoundError from "./exceptions/not-found";
import mcqAssignment from "../models/mcqAssignment";

interface ExtendedRequest extends Request {
  teacher: any;
}

class TeacherMCQStudentClass {
  private mcqAssignmentModel;

  constructor(mcqAssignmentModel) {
    this.mcqAssignmentModel = mcqAssignmentModel;
  }

  async editAssignment(req: Request) {
    try {
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
          },
          {
            runValidators: true,
            new: true,
          }
        )
        .select("--__v -students");
      if (!assignment) throw new NotFoundError("Assignment not found");
      return assignment;
    } catch (err) {
      throw err;
    }
  }

  async deleteAssignment(req: Request): Promise<void> {
    try {
      const extendedReq = req as ExtendedRequest;
      const { id } = extendedReq.params;

      const assignment = await this.mcqAssignmentModel.findOneAndDelete({
        teacher: extendedReq.teacher._id,
        _id: id,
      });
      if (!assignment) throw new NotFoundError("Assignment not found");
    } catch (err) {
      throw err;
    }
  }

  async getAssignmentsByClass(req: Request) {
    try {
      const extendedReq = req as ExtendedRequest;
      const { classID } = extendedReq.params;
      const assignments = await this.mcqAssignmentModel
        .find({
          teacher: extendedReq.teacher._id,
          classId: classID,
        })
        .select("-__v -student");

      const currentDate = Date.now();
      const formattedAssignments = assignments.reduce(
        (acc, assignment) => {
          if (assignment.dueDate > currentDate) acc.pending.push(assignment);
          else acc.expired.push(assignment);
        },
        {
          pending: [],
          expired: [],
        }
      );
      return formattedAssignments;
    } catch (err) {
      throw err;
    }
  }

  async getAssignment(req: Request) {
    try {
      const extendedReq = req as ExtendedRequest;
      const { assignmentID } = extendedReq.params;
      const assignment = await this.mcqAssignmentModel.findOne({
        _id: assignmentID,
        teacher: extendedReq.teacher._id,
      }); //Will have to populate based on the requirements
      //If assignment is pending, return students the assignment was assigned to, if the assignment has expired, return the students and their grades
      return assignment;
    } catch (err) {
      throw err;
    }
  }
}

export const teacherMCQService = new TeacherMCQStudentClass(mcqAssignment);
