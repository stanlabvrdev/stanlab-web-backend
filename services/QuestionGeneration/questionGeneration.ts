import axios from "axios";
import { parser, ParserInterface } from "../../utils/docParse";
import CustomError from "../exceptions/custom";
import env from "../../config/env";
import { GeneratedQuestions } from "../../models/generated-questions";
const QUESTION_GENERATION_MODEL = env.getAll().question_generation_model;

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
  private GeneratedQuestionsModel;

  constructor(parser: ParserInterface, GeneratedQuestionsModel) {
    this.parser = parser;
    this.GeneratedQuestionsModel = GeneratedQuestionsModel;
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
    const formattedData = await this.parser.parse(buffer, fileType);
    const callsToModel = formattedData.map((eachBlockofText) => this.callToModel(eachBlockofText));
    //Resolve promises and extract questions
    const questions: QuizQuestion[] = (await Promise.allSettled(callsToModel)).filter((each: any) => each.status === "fulfilled").map((each: any) => each.value.data);
    if (questions && questions.length !== 0) {
      const formattedQuestions = this.formatQuestions(questions);
      return await this.saveGeneratedQuestions(formattedQuestions);
    } else throw new CustomError(500, "Question Generation unsuccessful");
  }

  async genFromText(text: string): Promise<Questions[]> {
    const questions: QuizQuestion = (await this.callToModel(text)).data;
    if (questions) {
      const formattedQuestions = this.formatQuestions([questions]);
      return await this.saveGeneratedQuestions(formattedQuestions);
    } else throw new CustomError(500, "Question Generation unsuccessful");
  }

  private formatQuestions(arrayOfQuestions: QuizQuestion[]): Questions[] {
    const finalQuestions: Questions[] = [];
    //Loop through generated questions and extract the options - those that startwith 'Ans' are the correct ones while those that do not are false, classify accordingly
    arrayOfQuestions.forEach((each: QuizQuestion) => {
      // Convert each QuizQuestion object into an array of key-value pairs
      const entries: [string, string[]][] = Object.entries(each);
      for (let [question, options] of entries) {
        // Map each string in the options array to an object with an answer property and an isCorrect property
        let formattedOptions: Option[] = options.map((each) => {
          // If the string starts with "Ans:", set isCorrect to true and remove the "Ans: " prefix from the answer string elsereturn the answer unmodified and set the isCorrect field to false
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

  //Private method that saves the generated questions to the database and returns the questions to the client
  private async saveGeneratedQuestions(questions: Questions[]) {
    const savedQuestions = await this.GeneratedQuestionsModel.insertMany(questions, { rawResult: false });
    return savedQuestions;
  }
}

const QuestionGenerator = new QuestionGenerationClass(parser, GeneratedQuestions);

export { QuestionGenerator };
