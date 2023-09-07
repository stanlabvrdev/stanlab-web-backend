import { Schema, model, ObjectId } from "mongoose";

export interface TimeSlot {
  day: WeekDays;
  timetable: ObjectId;
  teacher: ObjectId | string;
  activity?: string;
  subject?: string;
  description?: string;
  topic?: string;
  teacherName?: string;
  timeSlot: string;
  color?: string;
}
export enum WeekDays {
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
  Sunday = "Sunday",
}

const timeSlotSchema = new Schema<TimeSlot>(
  {
    day: {
      type: WeekDays,
      required: true,
    },
    timetable: {
      type: Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
    activity: String,
    subject: String,
    description: String,
    topic: String,
    teacherName: String, //Where teacher id is not provided
    color: String,
  },
  {
    timestamps: true,
  }
);

timeSlotSchema.pre(/^find/, function (next) {
  this.populate({
    path: "teacher",
    select: "name",
  });
  next();
});

const TimeSlotModel = model<TimeSlot>("TimeSlot", timeSlotSchema);

export default TimeSlotModel;
