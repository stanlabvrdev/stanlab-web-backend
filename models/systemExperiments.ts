import mongoose from "mongoose";

export interface SystemExperiment {
  _id?: string;
  name: string;
  icon: string;
  objectives: string[];
  class: string;
  demoVideoUrl: string;
  bigQuestion: string;
  testYourKnowlege: string;
  testKnowlege: string[];
  teacherNote: any;
  subject: string;
  practicalName: string;
}

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
