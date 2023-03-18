import mongoose from "mongoose";

interface LabDoc extends mongoose.Document {
  acidName: string;
  experiment: string;
  baseName: string;
  indicatorName: string;
  acidVolume: number;
  baseVolume: number;
  points: number;
  subject: string;
  isActive: boolean;
  teacher: string;
}

const labsetupSchema = new mongoose.Schema(
  {
    acidName: { type: String },
    experiment: { type: String },
    baseName: { type: String },
    indicatorName: { type: String },
    acidVolume: { type: Number },
    baseVolume: { type: Number },
    points: { type: Number, default: 0 },
    subject: { type: String },
    isActive: { type: Boolean, default: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  },
  { strict: false }
);

export default mongoose.model<LabDoc>("LabSetup", labsetupSchema);
