import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import mcqAssignment from "../../models/mcqAssignment";
import BadRequestError from "../exceptions/bad-request";

interface ExtendedRequest extends Request {
  teacher: any;
}

class TeacherMCQStudentClass {
  async editAssignment(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { id } = extendedReq.params;
    const assignment = await mcqAssignment
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

    const assignment = await mcqAssignment.findOneAndDelete({
      teacher: extendedReq.teacher._id,
      _id: id,
    });
    if (!assignment) throw new NotFoundError("Assignment not found");
    return;
  }

  async getAssignmentsByCriteria(req: Request, criteria: object) {
    const extendedReq = req as ExtendedRequest;
    const assignments = await mcqAssignment
      .find({ teacher: extendedReq.teacher._id, ...criteria })
      .select("-__id -questions -students")
      .populate("classId", "title");
    if (assignments.length === 0) throw new NotFoundError("No assignments found");
    return assignments;
  }

  async getAssignmentsAssigned(req: Request) {
    const assignmentsAssigned = await this.getAssignmentsByCriteria(req, {
      "students.scores": { $size: 0 },
      dueDate: { $gte: Date.now() },
    });

    return assignmentsAssigned;
  }

  async getAssignmentsCompleted(req: Request) {
    const assignmentsCompleted = await this.getAssignmentsByCriteria(req, {
      "students.scores": { $ne: [], $exists: true },
    });
    return assignmentsCompleted;
  }

  async getAssignmentsUncompleted(req: Request) {
    const assignmentUnassigned = await this.getAssignmentsByCriteria(req, {
      "students.scores": { $size: 0 },
      dueDate: { $lte: Date.now() },
    });

    return assignmentUnassigned;
  }

  private assigmnentFilter(studentsArr, status: string) {
    if (status === "assigned") {
      const studentNames = studentsArr.filter((each) => each.scores.length < 1).map((each) => each.student.name);
      if (studentNames.length < 1) return "No students currently doing this assignment";
      return studentNames;
    } else if (status === "completed") {
      const studentWork = studentsArr
        .filter((each) => each.scores.length > 0)
        .map((each) => {
          return {
            name: each.student.name,
            scores: each.scores,
          };
        });
      if (studentWork.length < 1) return "No submissions yet for this assignment";
      return studentWork;
    }
  }

  async getAssignment(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { id } = req.params;
    const { status } = req.query;
    const validQueries = ["assigned", "completed"];
    if (!status || !validQueries.includes(status as string)) throw new BadRequestError("Invalid Request");
    const assigment = await mcqAssignment.findOne({ teacher: extendedReq.teacher._id, _id: id }, { _id: 0, students: 1, classId: 1 }).populate({ path: "students.student", select: "name" }).populate({ path: "classId", select: "title" });
    if (!assigment) throw new NotFoundError("Assignment not found");
    const students = assigment.students;
    const result = this.assigmnentFilter(students, status as string);
    return { class: assigment.classId["title"], students: result };
  }
}

export const teacherMCQService = new TeacherMCQStudentClass();
