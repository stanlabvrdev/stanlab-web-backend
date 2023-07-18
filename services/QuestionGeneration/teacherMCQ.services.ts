import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import mcqAssignment, { MCQAssignment } from "../../models/mcqAssignment";
import BadRequestError from "../exceptions/bad-request";
import { StudentScore } from "../../models/studentScore";
import { StudentAttrs } from "../../models/student";
import { Types } from "mongoose";

enum AssignmentState {
  Assigned = "assigned",
  Completed = "completed",
  Uncompleted = "uncompleted",
}

class TeacherMCQStudentClass {
  async editAssignment(req: Request): Promise<MCQAssignment> {
    const { id } = req.params;
    const assignment = await mcqAssignment
      .findOneAndUpdate(
        {
          teacher: req.teacher._id,
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
    const { id } = req.params;

    const assignment = await mcqAssignment.findOneAndDelete({
      teacher: req.teacher._id,
      _id: id,
    });
    if (!assignment) throw new NotFoundError("Assignment not found");
    await StudentScore.deleteMany({ assignmentId: id });
    return;
  }

  async getAssignmentsAssigned(req: Request): Promise<MCQAssignment[]> {
    const assignments = await mcqAssignment
      .find({
        dueDate: { $gte: new Date() },
        teacher: req.teacher._id,
        _id: {
          $in: await StudentScore.distinct("assignmentId", { isCompleted: false }),
        },
      })
      .select("-questions");
    if (assignments.length < 1) throw new NotFoundError("You currently have no assigned assignments!");
    return assignments;
  }

  async getAssignmentsCompleted(req: Request): Promise<MCQAssignment[]> {
    const assignments = await mcqAssignment
      .find({
        _id: {
          $in: await StudentScore.distinct("assignmentId", { isCompleted: true }),
        },
        teacher: req.teacher._id,
      })
      .select("-questions");
    if (assignments.length < 1) throw new NotFoundError("You currently have no completed assignments");
    return assignments;
  }

  async getAssignmentsUncompleted(req: Request): Promise<MCQAssignment[]> {
    const assignments = await mcqAssignment
      .find({
        dueDate: { $lt: new Date() },
        _id: {
          $in: await StudentScore.distinct("assignmentId", { isCompleted: false }),
        },
        teacher: req.teacher._id,
      })
      .select("-questions");
    if (assignments.length < 1) throw new NotFoundError("You currently have no uncompleted assignments");
    return assignments;
  }

  private async assigmnentFilter(status: string, assignmentId: string) {
    if (status === AssignmentState.Assigned || status === AssignmentState.Uncompleted) {
      const students = await StudentScore.find({ assignmentId, isCompleted: false }).populate({ path: "studentId", select: "name" });
      const studentNames = students.filter((student) => (student.studentId as StudentAttrs).name !== null).map((student) => (student.studentId as StudentAttrs).name);
      if (studentNames.length < 1) {
        return status === "assigned" ? "No students currently doing this assignment" : "All students have made submissions";
      }
      return studentNames;
    } else if (status === AssignmentState.Completed) {
      const students = await StudentScore.find({ assignmentId, isCompleted: true }).populate({ path: "studentId", select: "name" });
      const validStudents = students.filter((student) => (student.studentId as StudentAttrs).name !== null);
      const studentNames = validStudents.map((student) => {
        return { name: (student.studentId as StudentAttrs).name, score: student.score };
      });
      if (studentNames.length < 1) return "No submissions yet for this assignment";
      return studentNames;
    }
  }

  async getAssignment(req: Request) {
    const { id } = req.params;
    const { status } = req.query;
    const validQueries = [AssignmentState.Assigned, AssignmentState.Completed, AssignmentState.Uncompleted];
    if (!status || !validQueries.includes(status as AssignmentState)) throw new BadRequestError("Invalid Request");
    const assignment = await mcqAssignment.findOne({ teacher: req.teacher._id, _id: id }, { _id: 1, classId: 1 }).populate({ path: "classId", select: "title" });
    if (!assignment) throw new NotFoundError("Assignment not found");
    const result = await this.assigmnentFilter(status as string, assignment._id);
    return { class: assignment.classId["title"], students: result };
  }
}

export const teacherMCQService = new TeacherMCQStudentClass();
