import axios from "axios";
const { isValid } = require("mongoose").Types.ObjectId; // Used to check validity of a mongoose id in the edit question Group endpoint
import { parser, ParserInterface } from "../utils/docParse";
import CustomError from "../services/exceptions/custom";
import NotFoundError from "../services/exceptions/not-found";
import BadRequestError from "../services/exceptions/bad-request";
import { Profile } from "../models/profile";
import { StudentTeacherClass } from "../models/teacherStudentClass";
import env from "../config/env";
import { Student } from "../models/student";
import { Teacher } from "../models/teacher";
import { TeacherClass } from "../models/teacherClass";
import { GeneratedQuestions, QuestionGroup } from "../models/generated-questions";
import { createTopicalMcqNotification } from "./student/notification";
import { Request } from "express";
import mcqAssignment from "../models/mcqAssignment";
const QUESTION_GENERATION_MODEL = env.getAll().question_generation_model;

//Extended request to account for multer and authentication
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

//Interface for defining the final format of generated questions
interface Questions {
  question: string;
  options: Option[];
}

//Interface for defining the expected format of options
interface Option {
  answer: string;
  isCorrect: boolean;
}

//Function to check if a question structure confirms to the Questions interface
function isQuestions(obj: unknown): obj is Questions {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const { question, options } = obj as Questions;
  return typeof question === "string" && Array.isArray(options) && options.every((option) => typeof option.answer === "string" && typeof option.isCorrect === "boolean");
}

//Interface for defining the expected format of incoming generated questions - from the model
interface QuizQuestion {
  [question: string]: string[];
}

//An instance of this class can be used to generate and return formatted questions
class QuestionGenerationClass {
  private parser: ParserInterface;

  constructor(parser: ParserInterface) {
    this.parser = parser;
  }

  private callToModel(context: string) {
    try {
      return axios.post(QUESTION_GENERATION_MODEL!, {
        context,
        option_set: "Wordnet", //can take on another value such as "other"});
      });
    } catch (err) {
      throw err;
    }
  }

  async genFromFile(fileType: string, buffer: Buffer): Promise<Questions[]> {
    try {
      const formattedData = await this.parser.parse(buffer, fileType);
      const callsToModel = formattedData.map((eachBlockofText) => this.callToModel(eachBlockofText));
      //Resolve promises and extract questions
      const questions: QuizQuestion[] = (await Promise.allSettled(callsToModel)).filter((each: any) => each.status === "fulfilled").map((each: any) => each.value.data);
      if (questions && questions.length !== 0) return this.formatQuestions(questions);
      else throw new CustomError(500, "Question Generation unsuccessful");
    } catch (err) {
      throw err;
    }
  }

  async genFromText(text: string): Promise<Questions[]> {
    const questions: QuizQuestion = (await this.callToModel(text)).data;
    if (questions) return this.formatQuestions([questions]);
    else throw new CustomError(500, "Question Generation unsuccessful");
  }

  private async formatQuestions(arrayOfQuestions: QuizQuestion[]): Promise<Questions[]> {
    const finalQuestions: Questions[] = [];
    //Loop through generated questions and extract the options - those that startwith 'Ans' are the correct ones while those that do not are false, classify accordingly
    arrayOfQuestions.forEach((each: QuizQuestion) => {
      const entries: [string, string[]][] = Object.entries(each);
      for (let [question, options] of entries) {
        let formattedOptions: Option[] = options.map((each) => {
          if (each.startsWith("Ans:")) {
            return {
              answer: each.split(": ")[1],
              isCorrect: true,
            };
          } else {
            return {
              answer: each,
              isCorrect: false,
            };
          }
        });
        finalQuestions.push({
          question,
          options: formattedOptions,
        });
      }
    });
    return finalQuestions;
  }
}

//models is an object containing the models the class will utilize
//For now - GeneratedQuestions, Profile, QuestionGroup, Teacher, StudentTeacherClass, TeacherClass, mcqAssignments, Student
class GeneratedQuestionServiceClass {
  private models;
  constructor(models) {
    this.models = models;
  }

  async saveQuestions(req: Request) {
    const extendedReq = req as ExtendedRequest;
    try {
      const { questions, subject, topic } = extendedReq.body;
      const questionSavePromises = questions.map((each: Questions) => this.models.GeneratedQuestions.create(each)); //Maps through each question object in the array and saves the questions (returns an array of create promises)
      const savedQuests = await Promise.allSettled(questionSavePromises); //Awaits the array of promises created in the previous step
      const savedQuestionsID = savedQuests.filter((each) => each.status === "fulfilled").map((each: any) => each.value.id); //Extracts the id of the saved questions from the fulfilled promises
      let teacherCurrentSchool;
      let questGroup;
      const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });

      if (profile) {
        teacherCurrentSchool = profile.selectedSchool;
        questGroup = await this.models.QuestionGroup.create({
          teacher: extendedReq.teacher._id,
          subject,
          topic,
          questions: savedQuestionsID,
          school: teacherCurrentSchool,
        });
      }

      if (!profile) {
        questGroup = await this.models.QuestionGroup.create({
          teacher: extendedReq.teacher._id,
          subject,
          topic,
          questions: savedQuestionsID,
        });
      }

      return questGroup;
    } catch (err) {
      throw err;
    }
  }

  //The idea here is that after all the validations are done -each students get a copy of the assignment and the teacher also gets one
  //Now, the student's copy are stored on the teacher's copy so the teacher can track each student's progress and submissions
  async assignQuestions(req: Request, createTopicalMcqNotification) {
    const extendedReq = req as ExtendedRequest;
    const { questGroupId, classID, startDate, dueDate, type, duration, instruction, comments } = extendedReq.body;
    // const { Teacher, TeacherClass, QuestionGroup, Student, studentMCQ, teacherMCQ } = models;
    try {
      let assignmentType = type || "Practice";
      let testDuration: number | undefined = duration ? +duration : undefined;
      if (assignmentType !== "Practice" && assignmentType !== "Test") throw new BadRequestError("Assignment has to be of type Practice or Test");
      if (assignmentType === "Test" && testDuration !== undefined && !(testDuration > 0)) throw new BadRequestError("Enter a valid test duration");
      const teacher = await this.models.Teacher.findOne({
        _id: extendedReq.teacher._id,
      });

      // Check if question group exists
      let questGroup = await this.models.QuestionGroup.findOne({
        _id: questGroupId,
        teacher: extendedReq.teacher._id,
      }).populate(populateOptions);

      if (!questGroup) throw new NotFoundError("Questions not found");

      const foundQuestions = questGroup.questions.map((each) => {
        return {
          question: each.question,
          options: each.options,
        };
      });
      let teacherCurrentSchool;
      let teacherstudents;

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
      //Create assignment
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
      mcqAssignment.students = undefined; //masking the students array since there is no need for it
      return mcqAssignment;
    } catch (err) {
      throw err;
    }
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
      teacher, //Get details of signed in teacher
    } = req as ExtendedRequest;
    const options = {
      new: true,
    };

    //To check if the question group the user is trying to edit exists and was created by the user
    const questionExists = await QuestionGroup.findOne({ _id: id, teacher: teacher._id });
    if (!questionExists) throw new CustomError(400, "Resource not found or you are not authorized to edit this resource");

    //Array to store IDs of the updated questions, this also allows for the addition of a new question by the user
    const updatedIDs: string[] = [];
    for (const question of questions) {
      //Checks if the question has an id and is a valid mongodb id - this implies that it is a potentially existing question that needs to be updated
      if (question._id && isValid(question._id)) {
        const updatedQuestion = await GeneratedQuestions.findByIdAndUpdate(question._id, question, options);
        //Next line is a simple check to ensure the update was succesful - I assume only a successful op will return an object with an id - same with line 296
        if (updatedQuestion && updatedQuestion._id) updatedIDs.push(updatedQuestion._id);
      } else if (isQuestions(question)) {
        const savedQuestion = await GeneratedQuestions.create(question);
        if (savedQuestion && savedQuestion._id) updatedIDs.push(savedQuestion._id);
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
}

const models = { Teacher, Student, TeacherClass, Profile, StudentTeacherClass, GeneratedQuestions, QuestionGroup, mcqAssignment };
const GeneratedQuestionService = new GeneratedQuestionServiceClass(models);
const QuestionGenerator = new QuestionGenerationClass(parser);

export { QuestionGenerator, GeneratedQuestionService };
