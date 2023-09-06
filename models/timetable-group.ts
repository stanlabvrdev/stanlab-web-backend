import { Schema, model, ObjectId } from "mongoose";

export interface ITimetableGroup {
  _id: ObjectId;
  timeTableName: string;
  admin: ObjectId;
  collaborators: ObjectId[];
  published: TimetablePublishStatus;
  lastUpdate?: Date;
}
export enum TimetablePublishStatus {
  Published = "Published",
  Draft = "Draft",
}

const timetableGroup = new Schema<ITimetableGroup>(
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
    published: {
      type: String,
      enum: TimetablePublishStatus,
      default: TimetablePublishStatus.Draft,
    },
    timeTableGroupName: {
      type: String,
      required: true,
      default: `Timetable - ${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`,
    },
  },
  { timestamps: true }
);

const TimetableGroupModel = model<ITimetableGroup>("TimetableGroup", timetableGroup);

export default TimetableGroupModel;
