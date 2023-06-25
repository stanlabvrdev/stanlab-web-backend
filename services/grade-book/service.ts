import mongoose from "mongoose";
import { ProcessedData, formatJsonForTabularOutput, processPipelineData, topicalAssignmentPipeline } from "./grade-book.utils";
import { studentIncludeAttributes } from "../../models/student";
import { StudentScore } from "../../models/studentScore";
import { TeacherClass } from "../../models/teacherClass";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";

class GradeBookService {
  async getAllByClass(classId: string): Promise<any[]> {
    const classes = await StudentTeacherClass.find({ class: classId }).populate({ path: "student", select: studentIncludeAttributes }).lean().exec();

    if (classes.length == 0) return [];

    const result: any[] = [];

    for (let clas of classes) {
      const assignments = await StudentScore.find({ classId: classId, studentId: clas.student }).populate({
        path: "experimentId",
        select: ["_id", "experiment"],
      });

      clas.grade = assignments;

      result.push(clas);
    }

    return result;
  }

  async updateBulk(data: { id: string; score: number }[]) {
    const promises: any[] = [];
    for (let item of data) {
      if (!item.id || !item.score) throw new BadRequestError("score id and score value is required");

      promises.push(StudentScore.updateOne({ _id: item.id }, { score: item.score }));
    }

    return Promise.all(promises);
  }

  async getTopicalAssignmentGradesByClass(classID: string, teacherID: string): Promise<ProcessedData[]> {
    const pipeline = topicalAssignmentPipeline(classID, teacherID);

    const result = await TeacherClass.aggregate(pipeline);
    if (result.length === 0) throw new NotFoundError("You have not assigned any Topical assignments for this class yet");

    const data = processPipelineData(result);

    return formatJsonForTabularOutput(data);
  }
}

const gradeBookService = new GradeBookService();
export default gradeBookService;
