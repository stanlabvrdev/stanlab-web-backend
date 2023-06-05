import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import BadRequestError from "../exceptions/bad-request";
import mcqAssignment, { MCQAssignment } from "../../models/mcqAssignment";
import { LeanDocument } from "mongoose";
import CustomError from "../exceptions/custom";
import Notification from "../../models/notification";
import { GeneratedQuestion } from "../../models/generated-questions";

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

interface Grade {
  studentScore: number;
  maxScore: number;
}

export class StudentMCQClass {
  private studentHasSubmitted(assignment: LeanDocument<MCQAssignment>, studentID: any): Boolean {
    let studentWork = assignment.students!.find((each) => each.student == studentID)!;
    return studentWork.scores.length > 0;
  }

  private assignmentExpired(dueDate: Date): Boolean {
    return new Date() > dueDate;
  }

  private maskCorrectOptionField(questions: GeneratedQuestion[]): GeneratedQuestion[] {
    return questions.map((eachQuestion) => {
      const formattedOptions = eachQuestion.options.map((eachOption) => {
        return {
          _id: eachOption._id,
          answer: eachOption.answer,
        };
      });
      return {
        ...eachQuestion,
        options: formattedOptions,
      };
    });
  }

  private async markSubmission(submissions: { _id: string; choice: string }[], originalQuestions: GeneratedQuestion[]): Promise<Grade> {
    let score = 0;
    submissions.forEach(({ _id, choice }) => {
      const matchedQuestion = originalQuestions.find((question) => question._id == _id);
      if (matchedQuestion) {
        const isCorrect = matchedQuestion.options.find((option) => choice === option.answer && option.isCorrect);
        if (isCorrect) score++;
      }
    });
    return { studentScore: score, maxScore: originalQuestions.length };
  }

  async getAssignment(req: Request): Promise<LeanDocument<MCQAssignment>> {
    const extendedReq = req as ExtendedRequest;
    const student = extendedReq.student._id;
    const assignment = await mcqAssignment
      .findOne({
        _id: extendedReq.params.id,
        students: { $elemMatch: { student } },
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v")
      .lean();
    if (!assignment) throw new NotFoundError("Assignment not found");
    if (this.assignmentExpired(assignment.dueDate)) throw new CustomError(403, "Assignment expired!");
    if (assignment.type === "Test" && this.studentHasSubmitted(assignment, student)) throw new CustomError(403, "Multiple attempts are not allowed for this type of assignment");
    assignment.students = undefined;
    const notification = await Notification.findOne({ entity: assignment._id });
    notification.read = true;
    await notification.save();
    // assignment.questions = this.maskCorrectOptionField(assignment.questions as GeneratedQuestion[]);
    return assignment;
  }

  async getAssignments(req: Request): Promise<Accumulator> {
    const extendedReq = req as ExtendedRequest;
    const student = extendedReq.student._id;
    const assignments: LeanDocument<MCQAssignment>[] = await mcqAssignment
      .find({
        students: { $elemMatch: { student } },
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v -questions")
      .lean();

    const formattedAssignments = assignments.reduce(
      (acc: Accumulator, assignment: LeanDocument<MCQAssignment>) => {
        if (assignment.type === "Practice" && !this.assignmentExpired(assignment.dueDate)) {
          acc.pending.push(assignment);
        } else if (assignment.type === "Practice" && this.studentHasSubmitted(assignment, student)) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Practice" && !this.studentHasSubmitted(assignment, student)) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && this.studentHasSubmitted(assignment, student)) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Test" && this.assignmentExpired(assignment.dueDate)) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && !this.assignmentExpired(assignment.dueDate)) {
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

  async makeSubmission(req: Request): Promise<Grade> {
    const extendedReq = req as ExtendedRequest;
    const { submission } = extendedReq.body;
    const studentID = extendedReq.student._id;
    if (!submission) throw new BadRequestError("Make a valid submission");

    const assignment: MCQAssignment | null = await mcqAssignment
      .findOne({
        students: { $elemMatch: { student: studentID } },
        _id: extendedReq.params.id,
      })
      .populate("classId", "title")
      .populate("teacher", "name")
      .select("-__v");

    if (!assignment) throw new NotFoundError("Assigment not found");
    if (this.assignmentExpired(assignment.dueDate)) throw new BadRequestError("Assignment expired, cannot make a submission");
    //This maps out the score of the student making the request
    let studentWork = assignment.students!.find((each) => each.student == studentID)!;
    if (assignment.type === "Test" && this.studentHasSubmitted(assignment, studentID)) throw new BadRequestError("Already submitted");

    const grade = await this.markSubmission(submission, assignment.questions as GeneratedQuestion[]);
    if (assignment.type === "Practice" || (assignment.type === "Test" && !this.studentHasSubmitted(assignment, studentID))) {
      studentWork.scores.push({
        score: grade.studentScore,
        date: new Date(),
      });
    }
    assignment.markModified("students");
    await assignment.save({ validateModifiedOnly: true });
    return grade;
  }

  async getAssignmentScore(req: Request): Promise<{ subject: string; topic: string; scores: StudentWork[] }[]> {
    const extendedReq = req as ExtendedRequest;
    const studentID = extendedReq.student._id;
    const { id } = req.params;
    const assignments = await mcqAssignment.find({ classId: id, students: { $elemMatch: { student: studentID } } }).select("-__v -questions");
    if (!assignments || assignments.length < 1) throw new NotFoundError("No graded assignments at this moment");

    const studentWork = assignments.reduce((result: { subject: string; topic: string; scores: StudentWork[] }[], eachAssignment: MCQAssignment) => {
      const work = eachAssignment.students!.find((eachStudentWork) => eachStudentWork.student == studentID);
      if (work && work.scores.length > 0) {
        result.push({ subject: eachAssignment.subject, topic: eachAssignment.topic, scores: work.scores });
      }
      return result;
    }, []);
    return studentWork;
  }
}

export const studentMCQInstance = new StudentMCQClass();
