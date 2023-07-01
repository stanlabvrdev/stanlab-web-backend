import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import BadRequestError from "../exceptions/bad-request";
import mcqAssignment, { MCQAssignment } from "../../models/mcqAssignment";
import { LeanDocument, Types } from "mongoose";
import CustomError from "../exceptions/custom";
import Notification from "../../models/notification";
import { GeneratedQuestion } from "../../models/generated-questions";
import { StudentScore } from "../../models/studentScore";

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
    const studentId = req.student._id;
    const studentAttempt = await StudentScore.findOne({ assignmentId: req.params.id, studentId });
    if (!studentAttempt) throw new CustomError(403, "You are not allowed to to access this assigment");

    const assignment = await mcqAssignment.findById(req.params.id).populate("classId", "title").populate("teacher", "name").select("-__v").lean();
    if (!assignment) throw new NotFoundError("Assignment not found");

    if (new Date() < assignment.startDate) throw new CustomError(403, `You can start taking this assignment from ${assignment.startDate}`);
    if (this.assignmentExpired(assignment.dueDate)) throw new CustomError(403, "Assignment expired!");
    if (assignment.type === "Test" && studentAttempt.score) throw new CustomError(403, "Multiple attempts are not allowed for this type of assignment");
    const notification = await Notification.findOne({ entity: assignment._id });
    notification.read = true;
    await notification.save();

    assignment.questions = this.maskCorrectOptionField(assignment.questions as GeneratedQuestion[]);

    return assignment;
  }

  async getAssignments(req: Request): Promise<Accumulator> {
    const studentId = Types.ObjectId(req.student._id);
    const studentWorks = await StudentScore.aggregate([{ $match: { studentId: studentId } }, { $lookup: { from: "mcqassignments", localField: "assignmentId", foreignField: "_id", as: "assignment" } }, { $unwind: "$assignment" }]);
    if (studentWorks.length < 1) throw new NotFoundError("You have no assignments yet");

    const formattedAssignments = studentWorks.reduce(
      (acc: Accumulator, studentWork) => {
        const assignment = studentWork.assignment;
        if (assignment.type === "Practice" && !this.assignmentExpired(assignment.dueDate)) {
          acc.pending.push(assignment);
        } else if (assignment.type === "Practice" && studentWork.isCompleted) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Practice" && !studentWork.isCompleted) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && studentWork.isCompleted) {
          acc.submitted.push(assignment);
        } else if (assignment.type === "Test" && this.assignmentExpired(assignment.dueDate)) {
          acc.expired.push(assignment);
        } else if (assignment.type === "Test" && !this.assignmentExpired(assignment.dueDate)) {
          acc.pending.push(assignment);
        }
        assignment.students = undefined;
        assignment.questions = undefined;

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
    const { submission } = req.body;
    const studentId = req.student._id;
    if (!submission) throw new BadRequestError("Make a valid submission");

    const studentAttempt = await StudentScore.findOne({ assignmentId: req.params.id, studentId });
    if (!studentAttempt) throw new CustomError(403, "You are not allowed to to make a submission on this assigment");

    const assignment: MCQAssignment | null = await mcqAssignment.findOne({ _id: req.params.id }).populate("classId", "title").populate("teacher", "name").select("-__v");
    if (!assignment) throw new NotFoundError("Assignment not found");

    if (this.assignmentExpired(assignment.dueDate)) throw new BadRequestError("Assignment expired, cannot make a submission");
    if (assignment.type === "Test" && studentAttempt.score) throw new BadRequestError("Already submitted");

    const grade = await this.markSubmission(submission, assignment.questions as GeneratedQuestion[]);

    if (assignment.type === "Practice" || (assignment.type === "Test" && !studentAttempt.score)) {
      studentAttempt.score = grade.studentScore;
      await studentAttempt.save();
    }

    return grade;
  }

  async getAssignmentScoresByClass(req: Request): Promise<{ subject: string; topic: string; score: number }[]> {
    const studentId = Types.ObjectId(req.student._id);
    const { id } = req.params;
    const studentWorks = await StudentScore.aggregate([
      { $match: { studentId, isCompleted: true } },
      { $lookup: { from: "mcqassignments", localField: "assignmentId", foreignField: "_id", as: "assignment" } },
      { $unwind: "$assignment" },
      { $match: { "assignment.classId": Types.ObjectId(id) } },
    ]);

    if (studentWorks.length < 1) throw new NotFoundError("No graded assignments at this moment");
    const studentWork = studentWorks.map((eachWork) => {
      return { subject: eachWork.assignment.subject, topic: eachWork.assignment.topic, score: eachWork.score };
    });
    return studentWork;
  }
}

export const studentMCQInstance = new StudentMCQClass();
