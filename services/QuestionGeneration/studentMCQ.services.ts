import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import BadRequestError from "../exceptions/bad-request";
import mcqAssignment, { MCQAssignment } from "../../models/mcqAssignment";
import { LeanDocument } from "mongoose";

interface ExtendedRequest extends Request {
  student: any;
}

interface StudentWork {
  score: number;
  date: Date;
}

interface Accumulator {
  pending: LeanDocument<MCQAssignment>[];
  submitted: LeanDocument<MCQAssignment>[];
  expired: LeanDocument<MCQAssignment>[];
}

export class StudentMCQClass {
  async getAssignment(req: Request): Promise<LeanDocument<MCQAssignment>> {
    const extendedReq = req as ExtendedRequest;
    const assignment = await mcqAssignment
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

  async getAssignments(req: Request): Promise<Accumulator> {
    const extendedReq = req as ExtendedRequest;
    const currentDate = new Date();
    const assignments: LeanDocument<MCQAssignment>[] = await mcqAssignment
      .find({
        students: { $elemMatch: { student: extendedReq.student._id } },
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v -questions")
      .lean();

    const formattedAssignments = assignments.reduce(
      (acc: Accumulator, assignment: LeanDocument<MCQAssignment>) => {
        const students = assignment.students!;
        //This maps out the score of the student making the request
        const studentWork = students.find((each) => each.student == extendedReq.student._id)!;
        const studentScore = studentWork.scores;
        if (assignment.type === "Practice" && currentDate < assignment.dueDate) {
          acc.pending.push(assignment);
        } else if (assignment.type === "Practice" && studentScore.length > 0) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Practice" && studentScore.length === 0) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && studentScore.length > 0) {
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

  async makeSubmission(req: Request): Promise<void> {
    const extendedReq = req as ExtendedRequest;
    const { score } = extendedReq.body;
    const studentID = extendedReq.student._id;
    const assignment: MCQAssignment | null = await mcqAssignment
      .findOne({
        students: { $elemMatch: { student: studentID } },
        _id: extendedReq.params.id,
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v");

    if (!assignment) throw new NotFoundError("Assigment not found");
    if (new Date() > assignment.dueDate) throw new BadRequestError("Assignment expired, cannot make a submission");
    //This maps out the score of the student making the request
    let studentWork = assignment.students!.find((each) => each.student == studentID)!;

    if (assignment.type === "Practice" || (assignment.type === "Test" && studentWork.scores.length === 0)) {
      studentWork.scores.push({
        score,
        date: new Date(),
      });
    } else if (assignment.type === "Test" && studentWork.scores.length > 0) {
      throw new BadRequestError("Already submitted");
    }
    assignment.markModified("students");
    await assignment.save();
    // return studentWork
    return;
  }

  async getAssignmentScore(req: Request): Promise<StudentWork[] | string> {
    const extendedReq = req as ExtendedRequest;
    const studentID = extendedReq.student._id;
    const { id } = req.params;
    const assignment = await mcqAssignment.findOne({ _id: id, students: { $elemMatch: { student: studentID } } }).select("-__v -questions");
    if (!assignment) throw new NotFoundError("Assignment not found");

    const studentWork = assignment.students!.find((eachStudentWork) => eachStudentWork.student == studentID)!;
    if (studentWork.scores.length < 1) return "No submissions for this assignment";
    else return studentWork.scores;
  }
}

export const studentMCQInstance = new StudentMCQClass();
