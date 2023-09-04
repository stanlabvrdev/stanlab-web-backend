import { Schema, model, ObjectId } from "mongoose";

export interface Timetable {
  _id: ObjectId;
  timeTableName: string;
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
    },
    published: {
      type: String,
      enum: TimetablePublishStatus,
      default: TimetablePublishStatus.Draft,
    },
    className: String, //Where the class selected is not one that is in our database
    timeTableName: {
      type: String,
      required: true,
      default: `Timetable - ${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`,
    },
  },
  { timestamps: true }
);

const TimetableModel = model<Timetable>("Timetable", timetableSchema);

export default TimetableModel;
