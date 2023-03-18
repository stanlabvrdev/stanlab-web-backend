import mongoose from "mongoose";

const systemExperimentSchema = new mongoose.Schema({
  name: { type: String },
  icon: { type: String },
  objectives: { type: Array },
  class: { type: String },
  demoVideoUrl: { type: String },
  bigQuestion: { type: String },
  testYourKnowlege: { type: String },
  testKnowlege: { type: Array },
  teacherNote: { type: Object },
  subject: { type: String },
  practicalName: { type: String },
});

export default mongoose.model("SystemExperiment", systemExperimentSchema);
