import { Schema, model, ObjectId } from "mongoose";

export interface ITimetableGroup {
  _id: ObjectId;
  name: string;
  admin: ObjectId;
  collaborators: ObjectId[];
  published: TimetablePublishStatus;
  shareId: string;
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
    name: {
      type: String,
      required: true,
      default: `Timetable - ${Date.now()}`,
    },
    shareId: String,
  },
  { timestamps: true }
);

const TimetableGroupModel = model<ITimetableGroup>("TimetableGroup", timetableGroup);

export default TimetableGroupModel;
