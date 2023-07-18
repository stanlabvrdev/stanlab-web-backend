import { GeneratedQuestions, QuestionGroup } from "../models/generated-questions";
import mcqAssignment from "../models/mcqAssignment";
import { StudentScore } from "../models/studentScore";
import { createClass } from "./teacher";

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

const laterDate = new Date(new Date().getTime() + 60 * 60 * 1000);

export async function createAssignment(teacherID: string, studentID: string, score?: number, dueDate: Date = laterDate) {
  const teacherClass = await createClass(teacherID);
  const questGroup = await createQuestionGroup(teacherID);
  const foundQuestions = questGroup.questions.map((eachQuestionGroup) => {
    return { question: eachQuestionGroup.question, image: eachQuestionGroup.image, options: eachQuestionGroup.options, type: eachQuestionGroup.type };
  });

  const assignment = await mcqAssignment.create({
    teacher: teacherID,
    questions: foundQuestions,
    subject: questGroup.subject,
    topic: questGroup.topic,
    classId: teacherClass._id,
    startDate: new Date(),
    dueDate,
    duration: 3000,
    type: "Test",
  });

  const studentScore = await StudentScore.create({
    classId: teacherClass._id,
    assignmentId: assignment._id,
    studentId: studentID,
    teacherId: teacherID,
  });
  if (score) {
    studentScore.score = score;
    studentScore.isCompleted = true;
    studentScore.save();
  }

  return assignment;
}
