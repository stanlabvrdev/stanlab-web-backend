import { Configuration, OpenAIApi } from "openai";
import ENV from "../../config/env";
const { open_ai_key } = ENV.getAll();

const configuration = new Configuration({
  apiKey: open_ai_key,
});

const openai = new OpenAIApi(configuration);

export class OpenAIService {
  static async createCompleteion(prompt: string) {
    const response = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      prompt,
      max_tokens: 7,
      temperature: 0,
      stream: true,
    });
    //stream response
  }
}
