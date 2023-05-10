import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import BadRequestError from "../exceptions/bad-request";
import mcqAssignment from "../../models/mcqAssignment";

interface ExtendedRequest extends Request {
  student: any;
}

export class StudentMCQClass {
  private mcqAssignemntModel;
  constructor(mcqAssignemntModel) {
    this.mcqAssignemntModel = mcqAssignemntModel;
  }

  async getAssignment(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const assignment = await this.mcqAssignemntModel
      .findOne({
        _id: extendedReq.params.id,
        students: { $elemMatch: { student: extendedReq.student._id } },
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v")
      .lean();
    if (!assignment) throw new NotFoundError("Assignment not found");
    assignment.students = undefined;
    return assignment;
  }

  async getAssignments(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const currentDate = Date.now();
    const assignments = await this.mcqAssignemntModel
      .find({
        students: { $elemMatch: { student: extendedReq.student._id } },
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v -questions")
      .lean();

    const formattedAssignments = assignments.reduce(
      (acc, assignment) => {
        //This maps out the score of the student making the request
        const studentWork = assignment.students.find((each) => each.student == extendedReq.student._id).scores;
        if (assignment.type === "Practice" && currentDate < assignment.dueDate) {
          acc.pending.push(assignment);
        } else if (assignment.type === "Practice" && studentWork.length > 0) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Practice" && studentWork.length === 0) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && studentWork.length > 0) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Test" && currentDate >= assignment.dueDate) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && currentDate < assignment.dueDate) {
          acc.pending.push(assignment);
        }
        assignment.students = undefined;
        return acc;
      },
      {
        pending: [],
        submitted: [],
        expired: [],
      }
    );

    return formattedAssignments;
  }

  async makeSubmission(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { score } = extendedReq.body;
    const studentID = extendedReq.student._id;
    const assignment = await this.mcqAssignemntModel
      .findOne({
        students: { $elemMatch: { student: studentID } },
        _id: extendedReq.params.id,
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v");

    if (!assignment) throw new NotFoundError("Assigment not found");
    if (Date.now() > assignment.dueDate) throw new BadRequestError("Assignment expired, cannot make a submission");
    //This maps out the score of the student making the request
    let studentWork = assignment.students.find((each) => each.student == studentID);
    if (assignment.type === "Practice") {
      studentWork.scores.push({ score });
    } else if (assignment.type === "Test") {
      if (studentWork.scores.length > 0) throw new BadRequestError("Already submitted");
      studentWork.scores.push({
        score,
      });
    }

    assignment.markModified("students");
    await assignment.save();
    // return studentWork
    return;
  }

  async getAssignmentScore(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const studentID = extendedReq.student._id;
    const { id } = req.params;
    const assignment = await this.mcqAssignemntModel.findOne({ _id: id, students: { $elemMatch: { student: studentID } } }).select("-__v -questions");
    if (!assignment) throw new NotFoundError("Assignment not found");
    const studentWork = assignment.students.find((eachStudentWork) => eachStudentWork.student == studentID);
    if (studentWork.scores.length < 1) return "No submissions for this assignment";
    else return studentWork.scores;
  }
}

export const studentMCQInstance = new StudentMCQClass(mcqAssignment);
