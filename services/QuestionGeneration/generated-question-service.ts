const { isValid } = require("mongoose").Types.ObjectId; // Used to check validity of a mongoose id in the edit question Group endpoint
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
import { uploadImageToS3 } from "../../utils/s3ImageUpload";

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

// //Function to check if a question structure confirms to the Questions interface, like a custom typeguard
// function isQuestions(obj: unknown): obj is Questions {
//   // Check if the object is a valid object
//   if (!obj || typeof obj !== "object") {
//     return false;
//   }
//   const { question, options } = obj as Questions;
//   // Check if question is a string and if options is an array of objects with answer (string) and isCorrect (boolean) properties
//   return typeof question === "string" && Array.isArray(options) && options.every((option) => typeof option.answer === "string" && typeof option.isCorrect === "boolean");
// }

//models is an object containing the models the class will utilize
//For now - GeneratedQuestions, Profile, QuestionGroup, Teacher, StudentTeacherClass, TeacherClass, mcqAssignments, Student
class GeneratedQuestionServiceClass {
  private models;
  constructor(models) {
    this.models = models;
  }

  async saveQuestions(req: Request) {
    const extendedReq = req as ExtendedRequest;
    const { questions, subject, topic } = extendedReq.body;

    // Filter the incoming questions to get only those with ids
    const questionsWithIds = questions.filter((question) => question._id);

    // Create an array of promises to update each question with the updated draft field set to false
    const questionsUpdatePromises = questionsWithIds.map((question) => this.models.GeneratedQuestions.findByIdAndUpdate(question._id, { ...question, draft: false }, { runValidators: true, new: true }));

    // Wait for all the promises to settle - I do not want failed operations (maybe question not found et all) to be included, hence my choice of 'allSettled'
    const updatedQuestions = await Promise.allSettled(questionsUpdatePromises);

    // Extract the ids of the updated questions from the fulfilled promises
    const savedQuestionsID = updatedQuestions.filter((each) => each.status === "fulfilled").map((each: any) => each.value.id); //Extracts the id of the updated questions from the fulfilled promises

    if (savedQuestionsID.length < 1) throw new BadRequestError("Cannot save questions"); //if the incoming question format is wrong and for some reason no question is saved, this error is important because it is pointless to save an empty question group

    // Find the teacher's profile to get their selected school
    const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });

    // Create a new question group with the updated questions and the teacher's selected school if available - that is why I use optional chaining
    const questGroup = await this.models.QuestionGroup.create({
      teacher: extendedReq.teacher._id,
      subject,
      topic,
      questions: savedQuestionsID,
      school: profile?.selectedSchool, //refer to the comment above and notice the significance of the use of optional chaining
    });

    return questGroup;
  }

  async assignQuestions(req: Request, createTopicalMcqNotification) {
    const extendedReq = req as ExtendedRequest;
    const { questGroupId, classID, startDate, dueDate, type, duration, instruction, comments } = extendedReq.body;

    // Set default assignment type to Practice if not provided
    let assignmentType = type || "Practice";

    // Convert duration to a number, or set to undefined if not provided
    let testDuration = duration ? +duration : undefined;

    // Check if assignment type is valid
    const validAssignmentTypes = ["Practice", "Test"];
    if (!validAssignmentTypes.includes(assignmentType)) throw new BadRequestError("Assignment has to be of type Practice or Test");

    // Check if test duration is valid if assignment type is Test
    if (assignmentType === "Test" && testDuration !== undefined && !(testDuration > 0)) throw new BadRequestError("Enter a valid test duration");

    // Find teacher by ID
    const teacher = await this.models.Teacher.findOne({
      _id: extendedReq.teacher._id,
    });

    // Check if question group exists and get its questions
    let questGroup = await this.models.QuestionGroup.findOne({
      _id: questGroupId,
      teacher: extendedReq.teacher._id,
    }).populate(populateOptions);

    if (!questGroup) throw new NotFoundError("Questions not found");

    //To ensure the questions are stored on the assignment object directly, this function extracts the questions from the questGroup document
    const foundQuestions = questGroup.questions.map((each) => {
      return {
        question: each.question,
        image: each.image,
        options: each.options,
      };
    });

    let teacherCurrentSchool;
    let teacherstudents;

    // Find teacher's selected school if any
    const profile = await this.models.Profile.findOne({ teacher: extendedReq.teacher._id });

    if (profile) {
      teacherCurrentSchool = profile.selectedSchool;

      // If teacher has selected school, find the class in the school and its students
      let teacherClass = await this.models.TeacherClass.findOne({
        _id: classID,
        school: teacherCurrentSchool,
      });
      if (!teacherClass) throw new NotFoundError("Class not found");

      // Get students in the class
      teacherstudents = await this.models.StudentTeacherClass.find({ school: teacherCurrentSchool, class: teacherClass._id })
        .populate({ path: "student", select: ["_id"] })
        .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

      if (teacherstudents.length < 1) throw new NotFoundError("No student in this class");

      // Extract student IDs from student-teacher-class documents
      teacherstudents = teacherstudents.map((item) => item.student._id);
    } else if (!profile) {
      // If teacher does not have selected school, find the class by its ID and get its students
      let teacherClass = await this.models.TeacherClass.findOne({
        _id: classID,
        teacher: teacher._id,
      });
      if (!teacherClass) throw new NotFoundError("Class not found");

      teacherstudents = teacherClass.students;
      if (teacherstudents.length < 1) throw new NotFoundError("No student in this class found");
    }

    //This creates the array that stores each student's work.
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

    //Create notifications for each student
    const promises = teacherstudents.map((studentID: string) => createTopicalMcqNotification(studentID, mcqAssignment._id));
    await Promise.all(promises);
    mcqAssignment.students = undefined; //masking the students array since there is no need for it
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
      teacher, //Get details of signed in teacher
    } = req as ExtendedRequest;
    const options = { runValidators: true, new: true };

    //Check if the question group the user is trying to edit exists and was created by the user
    const questionExists = await QuestionGroup.findOne({ _id: id, teacher: teacher._id });
    if (!questionExists) throw new CustomError(400, "Resource not found or you are not authorized to edit this resource");

    //Array to store IDs of the updated questions, this also allows for the addition of a new question by the user
    const updatedIDs: string[] = [];
    for (const question of questions) {
      //Checks if the question has an id and is a valid mongodb id - this implies that it is a potentially existing question that needs to be updated
      if (question._id && isValid(question._id)) {
        const updatedQuestion = await GeneratedQuestions.findByIdAndUpdate(question._id, { ...question, draft: false }, options);
        //Next line is a simple check to ensure the update was succesful - I assume only a successful op will return an object with an id - same with line 296
        if (updatedQuestion && updatedQuestion._id) updatedIDs.push(updatedQuestion._id);
      }

      // else if (isQuestions(question)) {
      //   const savedQuestion = await GeneratedQuestions.create(question);
      //   if (savedQuestion && savedQuestion._id) {
      //   update draft status to false and re save document also think about how to catch errors that may occur in the create query - your objective would be to contnue code execution and ignore the error
      //   savedQuestion.draft = false
      //   await savedQuestion.save()
      //     updatedIDs.push(savedQuestion._id);
      //   }
      // }
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
    //There is a potential issue here - saveQuestions can modify the database while assign questions can fail - Possible solution, database transaction and a corresponding rollback incase of an error
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
    const { questionID } = req.params;
    //Get the question to be updated from the database
    const question = await this.models.GeneratedQuestions.findById(questionID);
    if (!question) throw new CustomError(401, "Operation not allowed");
    const imageURL = await uploadImageToS3(extendedReq.file);
    if (!imageURL) throw new CustomError(500, "Operation not successful");
    question.image = imageURL;
    await question.save();

    return { image: question.image };
  }
}

const models = { Teacher, Student, TeacherClass, Profile, StudentTeacherClass, GeneratedQuestions, QuestionGroup, mcqAssignment };
const GeneratedQuestionService = new GeneratedQuestionServiceClass(models);

export { GeneratedQuestionService };
