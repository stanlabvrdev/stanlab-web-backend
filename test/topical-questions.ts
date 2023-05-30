import { GeneratedQuestions, QuestionGroup } from "../models/generated-questions";

export async function createGeneratedQuestion() {
  const question = new GeneratedQuestions({
    question: "test question",
    options: [
      { answer: "false", isCorrect: false },
      { answer: "True", isCorrect: true },
    ],
    draft: true,
    type: "MCQ",
  });

  return question.save();
}

export async function createQuestionGroup(teacherID: string) {
  const createQuestionPromises = (await Promise.allSettled([createGeneratedQuestion(), createGeneratedQuestion(), createGeneratedQuestion()])).filter((each) => each.status === "fulfilled");
  const questions = createQuestionPromises.map((each: any) => each.value);
  const questGroup = await QuestionGroup.create({
    teacher: teacherID,
    subject: "Biology",
    topic: "Pollination",
    questions,
  });
  return questGroup;
}
