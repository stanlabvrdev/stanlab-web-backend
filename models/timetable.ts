import { Schema, model, ObjectId } from "mongoose";

export interface Timetable {
  admin: ObjectId;
  collaborators: ObjectId[];
  class: ObjectId;
  published: TimetablePublishStatus;
  teacherName?: string;
  className?: string;
  lastUpdate?: Date;
}
export enum TimetablePublishStatus {
  Published = "Published",
  Draft = "Draft",
}

const timetableSchema = new Schema<Timetable>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Administrator",
      required: true,
    },
    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
        required: true,
      },
    ],
    class: {
      type: Schema.Types.ObjectId,
      ref: "TeacherClass",
      required: true,
    },
    published: {
      type: String,
      enum: TimetablePublishStatus,
      default: TimetablePublishStatus.Draft,
    },
    teacherName: String,
    className: String,
    lastUpdate: Date,
  },
  { timestamps: true }
);

const TimetableModel = model<Timetable>("Timetable", timetableSchema);

export default TimetableModel;
