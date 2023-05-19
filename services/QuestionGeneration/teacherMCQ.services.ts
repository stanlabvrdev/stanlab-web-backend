import { Request } from "express";
import NotFoundError from "../exceptions/not-found";
import mcqAssignment from "../../models/mcqAssignment";
import BadRequestError from "../exceptions/bad-request";

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
  async getAssignmentsByCriteria(req: Request, criteria: object) {
    const extendedReq = req as ExtendedRequest;
    const assignments = await this.mcqAssignmentModel
      .find({ teacher: extendedReq.teacher._id, ...criteria })
      .select("-__id -questions -students")
      .populate("classId", "title");
    return assignments;
  }

  async getAssignmentAssigned(req: Request) {
    const assignmentsAssigned = await this.getAssignmentsByCriteria(req, {
      "students.scores": { $size: 0 },
    });
    return assignmentsAssigned;
  }

  async getAssignmentCompleted(req: Request) {
    const assignmentsCompleted = await this.getAssignmentsByCriteria(req, {
      "students.scores": { $ne: [], $exists: true },
    });
    return assignmentsCompleted;
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
    const assigment = await this.mcqAssignmentModel.findOne({ teacher: extendedReq.teacher._id, _id: id }, { _id: 0, students: 1 }).populate({ path: "students.student", select: "name" });
    const students = assigment.students;
    const result = this.assigmnentFilter(students, status as string);
    return result;
  }
}

export const teacherMCQService = new TeacherMCQStudentClass(mcqAssignment);
