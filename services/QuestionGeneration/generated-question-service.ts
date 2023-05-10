const { isValid } = require("mongoose").Types.ObjectId;
import CustomError from "../exceptions/custom";
import BadRequestError from "../exceptions/bad-request";
import { Profile } from "../../models/profile";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import { Student } from "../../models/student";
import { Teacher } from "../../models/teacher";
import { TeacherClass } from "../../models/teacherClass";
import { GeneratedQuestions, QuestionGroup } from "../../models/generated-questions";
import { createTopicalMcqNotification } from "../student/notification";
import { Request } from "express";
import mcqAssignment from "../../models/mcqAssignment";
import { csvUploaderService } from "../csv-uploader";
import { GeneratedQuestionHelperService } from "../QuestionGeneration/generatedQuestionHelper";

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

class GeneratedQuestionServiceClass {
  private models;
  private GeneratedQuestionHelperService;
  constructor(models, GeneratedQuestionHelperService) {
    this.models = models;
    this.GeneratedQuestionHelperService = GeneratedQuestionHelperService;
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

  private validateAssignmentDetails(type: string, duration: string | number) {
    let assignmentType = type === "Test" ? type : "Practice";
    let testDuration = duration ? +duration : undefined;
    if (assignmentType === "Test" && testDuration !== undefined && !(testDuration > 0)) throw new BadRequestError("Enter a valid test duration");
    return { assignmentType, testDuration };
  }

  async assignQuestions(req: Request, createTopicalMcqNotification) {
    const extendedReq = req as ExtendedRequest;
    const { questGroupId, classID, startDate, dueDate, type, duration, instruction, comments } = extendedReq.body;

    const { assignmentType, testDuration } = this.validateAssignmentDetails(type, duration);

    const teacher = await this.models.Teacher.findOne({ _id: extendedReq.teacher._id });

    const { questGroup, foundQuestions } = await this.GeneratedQuestionHelperService.extractQuestions(questGroupId, extendedReq.teacher._id);

    const { school, students } = await this.GeneratedQuestionHelperService.getTeacherStudentsAndSchool(classID, extendedReq.teacher._id);

    const studentWork = students.map((studentID: string) => {
      return {
        student: studentID,
        scores: [],
      };
    });

    const mcqAssignment = await this.models.mcqAssignment.create({
      teacher: teacher._id,
      questions: foundQuestions,
      subject: questGroup.subject,
      topic: questGroup.topic,
      classId: classID,
      startDate,
      dueDate,
      duration: testDuration,
      type: assignmentType,
      school: school,
      instruction,
      comments,
      students: studentWork,
    });

    const promises = students.map((studentID: string) => createTopicalMcqNotification(studentID, mcqAssignment._id));
    await Promise.all(promises);
    mcqAssignment.students = undefined;
    return mcqAssignment;
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

  async assignNow(req: Request) {
    const questGroup = await this.saveQuestions(req);
    req.body.questGroupId = questGroup._id;
    const assignment = await this.assignQuestions(req, createTopicalMcqNotification);
    return assignment;
  }

  async assignLater(req: Request) {
    const assignment = await this.assignQuestions(req, createTopicalMcqNotification);
    return assignment;
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
const GeneratedQuestionService = new GeneratedQuestionServiceClass(models, GeneratedQuestionHelperService);

export { GeneratedQuestionService };
