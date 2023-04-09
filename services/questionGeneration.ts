import axios from "axios";
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
import studentMCQ from "../models/studentMCQ";
import teacherMCQ from "../models/teacherMCQ";
import { createTopicalMcqNotification } from "./student/notification";
import { Request } from "express";
import { Question } from "../models/question";
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

//Interface for defining the expected format of incoming generated questions - from the model
interface QuizQuestion {
  [question: string]: string[];
}

//An instance of this class can be used to generate and return formatted questions
class QuestionGenerationClass {
  private parser: ParserInterface;
  private finalQuestions: Questions[];

  constructor(parser: ParserInterface) {
    this.parser = parser;
    this.finalQuestions = [];
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
        this.finalQuestions.push({
          question,
          options: formattedOptions,
        });
      }
    });
    return this.finalQuestions;
  }
}

//models is an object containing the models the class will utilize
//For now - GeneratedQuestions, Profile, QuestionGroup, Teacher, StudentTeacherClass, TeacherClass, studentMCQ, teacherMCQ, Student
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
    const { questGroupId, classID, startDate, dueDate, type } = extendedReq.body;
    // const { Teacher, TeacherClass, QuestionGroup, Student, studentMCQ, teacherMCQ } = models;
    try {
      let assignmentType = type || "Practice";
      if (assignmentType !== "Practice" && assignmentType !== "Test") throw new BadRequestError("Assignment has to be of type Practice or Test");
      const teacher = await this.models.Teacher.findOne({
        _id: extendedReq.teacher._id,
      });
      // Check if question group exists
      let questGroup = await this.models.QuestionGroup.findOne({
        _id: questGroupId,
        teacher: extendedReq.teacher._id,
      });
      if (!questGroup) throw new NotFoundError("Questions not found");

      let teacherCurrentSchool;
      let teacherClass;
      let teacherstudents;
      const promises: any = [];
      let teacherAssignment;
      let studentAssigments: any;

      const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });

      if (profile) {
        teacherCurrentSchool = profile.selectedSchool;

        teacherClass = await this.models.TeacherClass.findOne({
          _id: classID,
          school: teacherCurrentSchool,
        });

        teacherstudents = await this.models.StudentTeacherClass.find({ school: teacherCurrentSchool, class: teacherClass._id })
          .populate({ path: "student", select: ["_id"] })
          .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

        if (!teacherstudents) {
          throw new NotFoundError("No student found");
        }

        teacherstudents = teacherstudents.map((item) => item.student._id);

        const students = teacherstudents;
        if (students.length < 1) throw new NotFoundError("No student in this class");

        //Create teacher's copy of assignment
        teacherAssignment = await this.models.teacherMCQ.create({
          teacher: teacher._id,
          questions: questGroupId,
          classId: classID,
          startDate,
          dueDate,
          type: assignmentType,
          school: teacherCurrentSchool,
        });
        //Notifications promise array
        studentAssigments = [];
        for (let studentId of students) {
          const student = await this.models.Student.findOne({
            _id: studentId,
          });
          let studentAssignment: any = await this.models.studentMCQ.create({
            questions: questGroupId,
            classId: classID,
            startDate,
            dueDate,
            student: studentId,
            teacher: teacher._id,
            type: assignmentType,
            teacherAssignment: teacherAssignment._id,
            school: teacherCurrentSchool,
          });
          promises.push(createTopicalMcqNotification(student._id, studentAssignment._id));
          studentAssigments.push(studentAssignment._id);
        }
      }

      if (!profile) {
        teacherClass = await this.models.TeacherClass.findOne({
          _id: classID,
          teacher: teacher._id,
        });

        if (!teacherClass) throw new NotFoundError("Class not found");

        teacherstudents = teacherClass.students;

        if (teacherstudents.length < 1) {
          throw new NotFoundError("No student found");
        }

        const students = teacherstudents;
        if (students.length < 1) throw new NotFoundError("No student in this class");

        //Create teacher's copy of assignment
        teacherAssignment = await this.models.teacherMCQ.create({
          teacher: teacher._id,
          questions: questGroupId,
          classId: classID,
          startDate,
          dueDate,
          type: assignmentType,
        });
        //Notifications promise array
        studentAssigments = [];
        for (let studentId of students) {
          const student = await this.models.Student.findOne({
            _id: studentId,
          });
          let studentAssignment: any = await this.models.studentMCQ.create({
            questions: questGroupId,
            classId: classID,
            startDate,
            dueDate,
            student: studentId,
            teacher: teacher._id,
            type: assignmentType,
            teacherAssignment: teacherAssignment._id,
          });
          promises.push(createTopicalMcqNotification(student._id, studentAssignment._id));
          studentAssigments.push(studentAssignment._id);
        }
      }

      await Promise.all(promises);
      //Stores the students assignments id on the teacher's copy - will aid teacher tracking of student
      teacherAssignment.studentsWork = studentAssigments;
      await teacherAssignment.save();
      return teacherAssignment;
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
    const updatedQuestions: any = await Promise.allSettled(questions.map((each) => GeneratedQuestions.findByIdAndUpdate(each._id, each, options)));
    const newQuestionsID = updatedQuestions.filter((each) => each.value).map((each: any) => each.value._id);
    const update = {
      subject,
      topic,
      questions: newQuestionsID,
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

const models = { Teacher, Student, TeacherClass, Profile, StudentTeacherClass, GeneratedQuestions, QuestionGroup, studentMCQ, teacherMCQ };
const GeneratedQuestionService = new GeneratedQuestionServiceClass(models);
const QuestionGenerator = new QuestionGenerationClass(parser);

export { QuestionGenerator, GeneratedQuestionService };
