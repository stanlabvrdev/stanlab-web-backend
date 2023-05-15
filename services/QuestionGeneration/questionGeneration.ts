import axios from "axios";
import { parser } from "../../utils/docParse";
import CustomError from "../exceptions/custom";
import env from "../../config/env";
import { GeneratedQuestions } from "../../models/generated-questions";
const QUESTION_GENERATION_MODEL = env.getAll().question_generation_model;

interface Questions {
  question: string;
  options: Option[];
}

interface Option {
  answer: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  [question: string]: string[];
}

class QuestionGenerationClass {
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

  async genFromFile(fileType: string, buffer: Buffer) {
    const formattedData = await parser.parse(buffer, fileType);
    const callsToModel = formattedData.map((eachBlockofText) => this.callToModel(eachBlockofText));
    //Resolve promises and extract questions
    const questions: QuizQuestion[] = (await Promise.allSettled(callsToModel)).filter((each: any) => each.status === "fulfilled").map((each: any) => each.value.data);
    if (questions && questions.length !== 0) {
      const formattedQuestions = this.formatQuestions(questions);
      return await this.saveGeneratedQuestions(formattedQuestions);
    } else throw new CustomError(500, "Question Generation unsuccessful");
  }

  async genFromText(text: string) {
    const questions: QuizQuestion = (await this.callToModel(text)).data;
    if (!(Object.keys(questions).length === 0)) {
      const formattedQuestions = this.formatQuestions([questions]);
      return await this.saveGeneratedQuestions(formattedQuestions);
    } else throw new CustomError(500, "Question Generation unsuccessful");
  }

  private formatQuestions(arrayOfQuestions: QuizQuestion[]): Questions[] {
    const finalQuestions: Questions[] = [];
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

  private async saveGeneratedQuestions(questions: Questions[]) {
    const savedQuestions = await GeneratedQuestions.insertMany(questions, { rawResult: false });
    return savedQuestions;
  }
}

const QuestionGenerator = new QuestionGenerationClass();

export { QuestionGenerator };
