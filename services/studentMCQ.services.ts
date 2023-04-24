import { Request } from "express";
import NotFoundError from "./exceptions/not-found";
import BadRequestError from "./exceptions/bad-request";
import mcqAssignment from "../models/mcqAssignment";

interface ExtendedRequest extends Request {
  student: any;
}

const populateOptions = {
  path: "questions",
  populate: {
    path: "questions",
    select: "-__v",
    options: {
      lean: true,
    },
  },
};

class StudentMCQClass {
  private mcqAssignemntModel;
  constructor(mcqAssignemntModel) {
    this.mcqAssignemntModel = mcqAssignemntModel;
  }

  async getAssignment(req: Request) {
    try {
      const extendedReq = req as ExtendedRequest;
      const assignment = await this.mcqAssignemntModel
        .findOne({
          _id: extendedReq.params.id,
          students: { $elemMatch: { student: extendedReq.student._id } },
        })
        .populate(populateOptions)
        .populate("classId", "title")
        .populate("teacher", "name")
        .select("-__v")
        .lean();
      if (!assignment) throw new NotFoundError("Assignment not found");
      const studentWork = assignment.students.find((each) => each.student == extendedReq.student._id);
      assignment.students = studentWork;
      return assignment;
    } catch (err) {
      throw err;
    }
  }

  async getAssignments(req: Request) {
    try {
      const extendedReq = req as ExtendedRequest;
      const currentDate = Date.now();
      const assignments = await this.mcqAssignemntModel
        .find({
          students: { $elemMatch: { student: extendedReq.student._id } },
        })
        .populate("questions", "subject topic")
        .populate("classId", "title")
        .populate("teacher", "name")
        .select("-__v")
        .lean();

      const formattedAssignments = assignments.reduce(
        (acc, assignment) => {
          const studentWork = assignment.students.find((each) => each.student == extendedReq.student._id).scores;
          if (assignment.type === "Practice" && currentDate < assignment.dueDate) {
            acc.pending.push(assignment);
          } else if (assignment.type === "Practice" && studentWork.length > 0) {
            acc.submitted.push(assignment);
          } else if (assignment.type === "Practice" && studentWork.length === 0) {
            acc.expired.push(assignment);
          } else if (assignment.type === "Test" && assignment.scores.length > 0) {
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
    } catch (err) {
      throw err;
    }
  }

  async makeSubmission(req: Request) {
    try {
      const extendedReq = req as ExtendedRequest;
      const { score } = extendedReq.body;
      const studentID: string = extendedReq.student._id;
      const assignment = await this.mcqAssignemntModel
        .findOne({
          students: { $elemMatch: { student: studentID } },
          _id: extendedReq.params.id,
        })
        .populate("questions", "subject topic")
        .populate("classId", "title")
        .populate("teacher", "name")
        .select("-__v");

      if (!assignment) throw new NotFoundError("Assigment not found");
      if (Date.now() > assignment.dueDate) throw new BadRequestError("Assignment expired, cannot make a submission");
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

      return studentWork;
    } catch (err) {
      throw err;
    }
  }
}

export const studentMCQInstance = new StudentMCQClass(mcqAssignment);
