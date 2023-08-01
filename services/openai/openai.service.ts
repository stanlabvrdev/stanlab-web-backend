import { Configuration, OpenAIApi } from "openai";
import { Response } from "express";
import ENV from "../../config/env";
import BadRequestError from "../exceptions/bad-request";
const { open_ai_key, organization_id } = ENV.getAll();

const configuration = new Configuration({
  organization: organization_id,
  apiKey: open_ai_key,
});

const openai = new OpenAIApi(configuration);

export class OpenAIService {
  static async createCompletion(prompt: string) {
    if (open_ai_key === undefined || organization_id === undefined) throw new BadRequestError("OpenAI key or organization id is undefined");
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

  static async handleStream(stream: NodeJS.ReadableStream, res: Response): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let completeData = "";

      stream.on("data", (chunk: Buffer) => {
        const payloads = chunk.toString().split("\n\n");
        for (const payload of payloads) {
          if (payload.includes("[DONE]")) return;

          if (payload.startsWith("data:")) {
            const data = JSON.parse(payload.replace("data: ", ""));
            const chunk: undefined | string = data.choices[0].delta?.content;

            if (chunk) {
              completeData += chunk;
              res.write(chunk);
            }
          }
        }
      });

      stream.on("end", () => {
        setTimeout(() => res.status(200).end(), 10);
        resolve(completeData);
      });

      stream.on("error", (err: Error) => {
        reject(err);
      });
    });
  }
}
