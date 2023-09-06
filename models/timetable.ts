import { Schema, model, ObjectId } from "mongoose";

export interface Timetable {
  _id: ObjectId;
  timeTableName: string;
  admin: ObjectId;
  group: ObjectId;
  collaborators: ObjectId[];
  class: ObjectId;
  teacherName?: string;
  className?: string;
  lastUpdate?: Date;
}

const timetableSchema = new Schema<Timetable>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: "Administrator",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "TimetableGroup",
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
    className: String, //Where the class selected is not one that is in our database
  },
  { timestamps: true }
);

const TimetableModel = model<Timetable>("Timetable", timetableSchema);

export default TimetableModel;
