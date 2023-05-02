import mongoose from "mongoose";

import envConfig from "../config/env";
import { LabExperiment } from "../models/labAssignment";
import Logger from "./logger";

const env = envConfig.getAll();

async function runEperimentLabelSeed() {
  const experiments = await LabExperiment.find({ "experiment.label": null });

  if (experiments.length > 0) {
    let counter = experiments.length;
    for (let data of experiments) {
      const words = data.experiment.name.split(" ");
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

export async function runSeeds() {
  await runEperimentLabelSeed();
}

export default mongoose.connect(env.mongodb_URI!, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true,
});
