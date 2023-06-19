import axios from "axios";
import { parser } from "../../utils/docParse";
import CustomError from "../exceptions/custom";
import env from "../../config/env";
import { GeneratedQuestions } from "../../models/generated-questions";
import BadRequestError from "../exceptions/bad-request";
const { question_generation_model: QUESTION_GENERATION_MODEL, true_or_false_model: TRUE_OR_FALSE_MODEL } = env.getAll();
import { Document } from "mongoose";

export interface Questions {
  question: string | undefined;
  options: Option[];
  type: string;
}

export interface Option {
  answer: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  answer: string;
  context: string;
  extra_options: string[];
  id: number;
  options: string[];
  options_algorithm: string;
  question_statement: string;
  question_type: string;
}

abstract class QuestionGenerator {
  abstract generate(text: string): Promise<Questions[]>;
}

class MCQQuestionGenerator extends QuestionGenerator {
  async generate(text: string): Promise<Questions[]> {
    const callToModel = await axios.post(QUESTION_GENERATION_MODEL!, { text, type: "mcq" });
    const questions: QuizQuestion[] = callToModel.data.questions;
    return Object.keys(questions).length !== 0 ? formatQuestions.formatMCQ(questions) : [];
  }
}

class TFQuestionGenerator extends QuestionGenerator {
  async generate(text: string): Promise<Questions[]> {
    const callToModel = await axios.post(TRUE_OR_FALSE_MODEL!, { text });
    const questions: string[][] = callToModel.data;
    return questions.length !== 0 ? formatQuestions.formatTrueorFalse(questions) : [];
  }
}

class QuestionGeneratorFactory {
  static create(type: string): QuestionGenerator {
    if (type === "MCQ") {
      return new MCQQuestionGenerator();
    } else if (type === "TOF") {
      return new TFQuestionGenerator();
    } else {
      throw new BadRequestError("Invalid question type");
    }
  }
}

class QuestionGenerationService {
  async genFromFile(type: string, fileType: string, buffer: Buffer): Promise<Document<Questions>[]> {
    const formattedData = await parser.parse(buffer, fileType);
    const generator = QuestionGeneratorFactory.create(type);
    const callsToModel = formattedData.map((eachBlockofText) => generator.generate(eachBlockofText));
    const [questions] = (await Promise.allSettled(callsToModel)).filter((each: any) => each.status === "fulfilled").map((each: any) => each.value);
    if (!questions || questions.length < 1) throw new CustomError(500, "Question Generation unsuccessful");
    return await this.saveGeneratedQuestions(questions);
  }

  async genFromText(type: string, text: string): Promise<Document<Questions>[]> {
    const generator = QuestionGeneratorFactory.create(type);
    const questions = await generator.generate(text);
    if (questions.length < 1) throw new CustomError(500, "Question Generation unsuccessful");
    return await this.saveGeneratedQuestions(questions);
  }

  private async saveGeneratedQuestions(questions: Questions[]): Promise<Document<Questions>[]> {
    const savedQuestions = await GeneratedQuestions.insertMany(questions, { rawResult: false });
    return savedQuestions;
  }
}

class FormatQuestionsClass {
  formatMCQ(questions: QuizQuestion[]): Questions[] {
    const formattedQuestions = questions.map((question: QuizQuestion) => {
      const { options, extra_options, question_statement } = question;

      const completeOptions = options.concat(extra_options);

      const formattedOptions: Option[] = completeOptions.map((eachOption) => {
        return { answer: eachOption, isCorrect: false };
      });
      formattedOptions.push({ answer: question.answer, isCorrect: true });
      return { question: question_statement, options: formattedOptions, type: "MCQ" };
    });

    return formattedQuestions;
  }

  formatTrueorFalse(arrayOfQuestions: string[][]): Questions[] {
    const formattedArray: Questions[] = arrayOfQuestions.map((nestedArray: string[]) => {
      const options = nestedArray.slice(0, 2).map((option, index) => ({
        answer: option.startsWith("True: ") ? option.substring(6) : option,
        isCorrect: option.startsWith("True: ") && index === 0,
      }));

      return { question: undefined, options, type: "TOF" };
    });
    return formattedArray;
  }
}

const formatQuestions = new FormatQuestionsClass();

const questionGenerationService = new QuestionGenerationService();

export { questionGenerationService };
