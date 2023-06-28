import mongoose from "mongoose";

import envConfig from "../config/env";
import { LabExperiment } from "../models/labAssignment";
import Logger from "./logger";
import { GeneratedQuestions } from "../models/generated-questions";
import mcqAssignment, { ScoreObject } from "../models/mcqAssignment";
import { IStudentScore, StudentScore } from "../models/studentScore";

const env = envConfig.getAll();

async function runEperimentLabelSeed() {
  const experiments = await LabExperiment.find({ "experiment.label": null });

  if (experiments.length > 0) {
    let counter = experiments.length;
    for (let data of experiments) {
      const words = data.experiment?.name.split(" ");
      const name = words.slice(0, words.length - 1).join(" ");

      const updateData = { "experiment.label": name };

      Logger.info(`
    ============================
    Updating Data ${JSON.stringify(updateData)}

    count: ${counter}
    ============================
    `);
      await LabExperiment.updateOne({ _id: data._id }, updateData);

      counter--;
    }
  }
}

export async function QuestionTypeMigration() {
  await GeneratedQuestions.updateMany(
    { type: { $exists: false } },
    {
      $set: { type: "MCQ" },
    }
  );
}

function findHighestScore(scores: ScoreObject[]): number {
  let highestScore = -Infinity;

  for (const scoreObj of scores) {
    const score = scoreObj.score;
    if (score > highestScore) {
      highestScore = score;
    }
  }

  return highestScore;
}

export async function AssignmentScoresMigration(): Promise<void> {
  try {
    const assignments = await mcqAssignment.find();
    const newDocsArr: IStudentScore[] = [];

    for (const assignment of assignments) {
      if (assignment.students && assignment.students.length > 0) {
        for (const student of assignment.students) {
          const studentDoc: IStudentScore = {
            classId: assignment.classId,
            assignmentId: assignment._id,
            studentId: student.student,
            teacherId: assignment.teacher,
            school: assignment.school,
          };
          if (student.scores && student.scores.length > 0) {
            const score = findHighestScore(student.scores);
            studentDoc.score = score;
          }
          if (studentDoc.score) {
            studentDoc.isCompleted = true;
          }
          newDocsArr.push(studentDoc);
        }
      }
    }
    await StudentScore.insertMany(newDocsArr);
  } catch (error) {
    Logger.error(`Migration Error: ${error}`);
  }
}

export async function runSeeds() {
  await runEperimentLabelSeed();
}

export default mongoose.connect(env.mongodb_URI!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
