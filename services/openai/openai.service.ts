import { Configuration, OpenAIApi } from "openai";
import { Response } from "express";
import ENV from "../../config/env";
const { open_ai_key, organization_id } = ENV.getAll();

const configuration = new Configuration({
  organization: organization_id,
  apiKey: open_ai_key,
});

const openai = new OpenAIApi(configuration);

export class OpenAIService {
  static async createCompletion(prompt: string) {
    const response = await openai.createChatCompletion(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        stream: true,
      },
      { responseType: "stream" }
    );
    return response;
  }

  static async handleStream(stream: NodeJS.ReadableStream, res: Response) {
    stream.on("data", (chunk: Buffer) => {
      const payloads = chunk.toString().split("\n\n");
      for (const payload of payloads) {
        if (payload.includes("[DONE]")) return;

        if (payload.startsWith("data:")) {
          const data = JSON.parse(payload.replace("data: ", ""));
          const chunk: undefined | string = data.choices[0].delta?.content;

          if (chunk) res.write(chunk);
        }
      }
    });

    stream.on("end", () => setTimeout(() => res.end(), 10));

    stream.on("error", (err: Error) => {
      throw err;
    });
  }
}
