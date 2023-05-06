const { isValid } = require("mongoose").Types.ObjectId;
import CustomError from "../exceptions/custom";
import NotFoundError from "../exceptions/not-found";
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

function getFileExtension(mimeType) {
  const parts = mimeType.split("/");
  return parts[1];
}

class GeneratedQuestionServiceClass {
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

  async assignQuestions(req: Request, createTopicalMcqNotification) {
    const extendedReq = req as ExtendedRequest;
    const { questGroupId, classID, startDate, dueDate, type, duration, instruction, comments } = extendedReq.body;

    let assignmentType = type === "Test" ? type : "Practice";
    let testDuration = duration ? +duration : undefined;
    if (assignmentType === "Test" && testDuration !== undefined && !(testDuration > 0)) throw new BadRequestError("Enter a valid test duration");

    // Find teacher by ID
    const teacher = await this.models.Teacher.findOne({
      _id: extendedReq.teacher._id,
    });

    // Check if question group exists and get its questions
    let questGroup = await this.models.QuestionGroup.findOne({ _id: questGroupId, teacher: extendedReq.teacher._id }).populate(populateOptions);
    if (!questGroup) throw new NotFoundError("Questions not found");

    const foundQuestions = questGroup.questions.map((eachQuestionGroup) => {
      return { question: eachQuestionGroup.question, image: eachQuestionGroup.image, options: eachQuestionGroup.options };
    });

    let teacherCurrentSchool;
    let teacherstudents;

    // Find teacher's selected school if any
    const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });

    if (profile) {
      teacherCurrentSchool = profile.selectedSchool;

      let teacherClass = await this.models.TeacherClass.findOne({
        _id: classID,
        school: teacherCurrentSchool,
      });
      if (!teacherClass) throw new NotFoundError("Class not found");

      teacherstudents = await this.models.StudentTeacherClass.find({ school: teacherCurrentSchool, class: teacherClass._id })
        .populate({ path: "student", select: ["_id"] })
        .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

      if (teacherstudents.length < 1) throw new NotFoundError("No student in this class");

      teacherstudents = teacherstudents.map((item) => item.student._id);
    } else if (!profile) {
      let teacherClass = await this.models.TeacherClass.findOne({
        _id: classID,
        teacher: teacher._id,
      });
      if (!teacherClass) throw new NotFoundError("Class not found");

      teacherstudents = teacherClass.students;
      if (teacherstudents.length < 1) throw new NotFoundError("No student in this class found");
    }

    const studentWork = teacherstudents.map((studentID: string) => {
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
      school: teacherCurrentSchool,
      instruction,
      comments,
      students: studentWork,
    });

    const promises = teacherstudents.map((studentID: string) => createTopicalMcqNotification(studentID, mcqAssignment._id));
    await Promise.all(promises);
    mcqAssignment.students = undefined;
    return mcqAssignment;
  }

  async getQuestions(teacherID) {
    return await QuestionGroup.find({
      teacher: teacherID,
    }).populate(populateOptions);
  }

  async deleteQuestionGroup(id) {
    const deletedGroup = await QuestionGroup.findByIdAndDelete(id);
    if (deletedGroup) return { code: 200, message: "Deleted Successfully" };
    else return { code: 404, message: "Resource not found" };
  }

  async getAQuestionGroup(questionGroupID, teacherID) {
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
        if (updatedQuestion && updatedQuestion._id) updatedIDs.push(updatedQuestion._id);
      }
    }

    const update = {
      subject,
      topic,
      questions: updatedIDs,
    };
    const updated = await QuestionGroup.findByIdAndUpdate(
      id,
      {
        $set: update,
      },
      options
    ).populate(populateOptions);
    return updated;
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
    const fileExtension = getFileExtension(extendedReq.file.mimeType);
    const key = `${new Date()}-${extendedReq.file.originalname}.${fileExtension}`;
    const imageData = await csvUploaderService.doUpload(extendedReq.file, key, extendedReq.file.mimetype);
    if (!imageData) throw new CustomError(500, "Image upload not successful");

    return { image: imageData.Location };
  }
}

const models = { Teacher, Student, TeacherClass, Profile, StudentTeacherClass, GeneratedQuestions, QuestionGroup, mcqAssignment };
const GeneratedQuestionService = new GeneratedQuestionServiceClass(models);

export { GeneratedQuestionService };
