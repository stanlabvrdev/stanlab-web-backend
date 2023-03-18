import {
  genQuestions,
  formatQuestions,
  saveGeneratedQuestions,
  assignQuestions,
} from "../../services/questionGeneration";
import { GeneratedQuestions, QuestionGroup } from "../../models/generated-questions";
import studentMCQ from "../../models/studentMCQ";
import teacherMCQ from "../../models/teacherMCQ";
import { Teacher } from "../../models/teacher";
import { TeacherClass } from "../../models/teacherClass";
import { Student } from "../../models/student";
import { createTopicalMcqNotification } from "../../services/student/notification";
import axios from "axios";
import CustomError from "../../services/exceptions/custom";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";

//For general use in queries here reduce processing time, returns regular js docs instead of mongoose docs
const populateOptions = {
  path: "questions",
  select: "-__v",
  options: {
    lean: true,
  },
};
const models = {
  Teacher,
  TeacherClass,
  QuestionGroup,
  Student,
  studentMCQ,
  teacherMCQ,
};

async function genFromFile(req, res) {
  try {
    if (!req.file) throw new CustomError(400, "No file uploaded");
    const questions = await genQuestions(req.file.mimetype, req.file.buffer);
    if (questions && questions.length !== 0) {
      const finalQuestions = formatQuestions(questions);
      return ServerResponse(req, res, 200, finalQuestions, "Questions generated successfully");
    } else throw new CustomError(500, "Question Generation unsuccessful");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function genFromText(req, res) {
  try {
    if (!req.body.text) throw new CustomError(400, "Upload text to generate questions");
    const questions = (
      await axios.post("https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion", {
        context: req.body.text,
        option_set: "Wordnet", //Can be other or Wordnet
      })
    ).data;
    if (questions && questions.length !== 0) {
      const finalQuestions = formatQuestions([questions]);
      return ServerResponse(req, res, 200, finalQuestions, "Questions generated successfully");
    } else throw new CustomError(500, "Question Generation unsuccessful");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function saveQuestions(req, res) {
  try {
    const questGroup = await saveGeneratedQuestions(req, GeneratedQuestions, QuestionGroup);
    return ServerResponse(req, res, 200, questGroup, "Questions saved to 'Question bank'");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function getQuestions(req, res) {
  try {
    const questions = await QuestionGroup.find({
      teacher: req.teacher._id,
    }).populate(populateOptions);
    ServerResponse(req, res, 200, questions, "Successful");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function deleteQuestionGroup(req, res) {
  try {
    const { id } = req.params;
    const deletedGroup = await QuestionGroup.findByIdAndDelete(id);
    if (deletedGroup) return ServerResponse(req, res, 200, undefined, "Deleted Successfully");
    else return ServerResponse(req, res, 404, undefined, "Resource not found");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function getAQuestionGroup(req, res) {
  try {
    const { id } = req.params;
    const questionGroup = await QuestionGroup.findOne({
      _id: id,
    }).populate(populateOptions);
    if (questionGroup) return ServerResponse(req, res, 200, questionGroup, "Successful");
    else return ServerResponse(req, res, 404, undefined, "Questions, Not found");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function editQuestionGroup(req, res) {
  try {
    const id = req.params.id;
    const questions = req.body.questions;
    const options = {
      new: true,
    };
    const updatedQuestions: any = await Promise.allSettled(
      questions.map((each) => GeneratedQuestions.findByIdAndUpdate(each._id, each, options))
    );
    const newQuestionsID = updatedQuestions.filter((each) => each.value).map((each: any) => each.value._id);
    const update = {
      subject: req.body.subject,
      topic: req.body.topic,
      questions: newQuestionsID,
    };
    const updated = await QuestionGroup.findByIdAndUpdate(
      id,
      {
        $set: update,
      },
      options
    ).populate(populateOptions);
    ServerResponse(req, res, 200, updated, "Update successful");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function assignNow(req, res) {
  try {
    const questGroup = await saveGeneratedQuestions(req, GeneratedQuestions, QuestionGroup);
    req.body.questGroupId = questGroup._id;
    const assignment = await assignQuestions(req, models, createTopicalMcqNotification);
    ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function assignLater(req, res) {
  try {
    const assignment = await assignQuestions(req, models, createTopicalMcqNotification);
    ServerResponse(req, res, 201, assignment, "Topical assignment assigned");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

export {
  genFromFile,
  genFromText,
  saveQuestions,
  getQuestions,
  deleteQuestionGroup,
  getAQuestionGroup,
  editQuestionGroup,
  assignNow,
  assignLater,
};
