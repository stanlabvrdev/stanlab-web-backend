const { isValid } = require("mongoose").Types.ObjectId;
import CustomError from "../exceptions/custom";
import BadRequestError from "../exceptions/bad-request";
import { Profile } from "../../models/profile";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import { Student } from "../../models/student";
import { Teacher } from "../../models/teacher";
import { TeacherClass } from "../../models/teacherClass";
import { GeneratedQuestions, QuestionGroup } from "../../models/generated-questions";
import { Request } from "express";
import mcqAssignment from "../../models/mcqAssignment";
import { csvUploaderService } from "../csv-uploader";

interface ExtendedRequest extends Request {
  file: any;
  teacher: any;
}
const populateOptions = {
  path: "questions",
  select: "-__v",
  options: {
    lean: true,
  },
};

class GeneratedQuestionManagementServiceClass {
  private models;

  constructor(models) {
    this.models = models;
  }

  async saveQuestions(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { questions, subject, topic } = extendedReq.body;

    const questionsWithIds = questions.filter((question) => question._id);
    const questionsUpdatePromises = questionsWithIds.map((question) => this.models.GeneratedQuestions.findByIdAndUpdate(question._id, { ...question, draft: false }, { runValidators: true, new: true }));
    const updatedQuestions = await Promise.allSettled(questionsUpdatePromises);
    const savedQuestionsID = updatedQuestions.filter((each) => each.status === "fulfilled").map((each: any) => each.value.id);
    if (savedQuestionsID.length < 1) throw new BadRequestError("Cannot save questions");
    const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });
    const questGroup = await this.models.QuestionGroup.create({
      teacher: extendedReq.teacher._id,
      subject,
      topic,
      questions: savedQuestionsID,
      school: profile?.selectedSchool,
    });

    return questGroup;
  }

  async getQuestions(teacherID: string) {
    return await QuestionGroup.find({
      teacher: teacherID,
    }).populate(populateOptions);
  }

  async deleteQuestionGroup(id: string) {
    const deletedGroup = await QuestionGroup.findByIdAndDelete(id);
    if (deletedGroup) return { code: 200, message: "Deleted Successfully" };
    else return { code: 404, message: "Resource not found" };
  }

  async getAQuestionGroup(questionGroupID: string, teacherID: string) {
    const questionGroup = await QuestionGroup.findOne({
      _id: questionGroupID,
      teacher: teacherID,
    }).populate(populateOptions);
    if (questionGroup) return { code: 200, data: questionGroup, message: "Successful" };
    else return { code: 404, message: "Questions, Not found" };
  }

  async editQuestionGroup(req: Request) {
    const {
      params: { id },
      body: { questions, subject, topic },
      teacher,
    } = req as ExtendedRequest;
    const options = { runValidators: true, new: true };

    const questionExists = await QuestionGroup.findOne({ _id: id, teacher: teacher._id });
    if (!questionExists) throw new CustomError(400, "Resource not found or you are not authorized to edit this resource");

    const updatedIDs: string[] = [];
    for (const question of questions) {
      if (question._id && isValid(question._id)) {
        const updatedQuestion = await GeneratedQuestions.findByIdAndUpdate(question._id, { ...question, draft: false }, options);
        if (updatedQuestion?._id) updatedIDs.push(updatedQuestion._id);
      }
    }

    const update = {
      subject,
      topic,
      questions: updatedIDs,
    };
    const updatedQuestionGroup = await QuestionGroup.findByIdAndUpdate(id, { $set: update }, options).populate(populateOptions);
    return updatedQuestionGroup;
  }

  async addImageToQuestion(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const key = `${new Date()}-${extendedReq.file.originalname}`;
    const imageData = await csvUploaderService.doUpload(extendedReq.file.buffer, key, extendedReq.file.mimetype);
    if (!imageData) throw new CustomError(500, "Image upload not successful");

    return { image: imageData.Location };
  }
}

const models = { Teacher, Student, TeacherClass, Profile, StudentTeacherClass, GeneratedQuestions, QuestionGroup, mcqAssignment };
const GeneratedQuestionManagementService = new GeneratedQuestionManagementServiceClass(models);

export { GeneratedQuestionManagementService };
