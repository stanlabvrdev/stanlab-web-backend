import { Schema, model, ObjectId } from "mongoose";

export interface TimeSlot {
  day: WeekDays;
  timetable: ObjectId;
  startTime: number;
  endTime: number;
  teacher: ObjectId | string;
  activity?: string;
  subject?: string;
  description?: string;
  topic?: string;
  teacherName?: string;
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
    startTime: {
      type: Number,
      required: true,
      min: 0,
      max: 1339,
      validate: {
        validator: function (this: TimeSlot, value: number) {
          return value < this.endTime;
        },
        message: "Start time must be before end time.",
      },
    },
    endTime: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
      validate: {
        validator: function (this: TimeSlot, value: number) {
          return value > this.startTime;
        },
        message: "End time must be after start time.",
      },
    },
    teacher: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    activity: String,
    subject: String,
    description: String,
    topic: String,
    teacherName: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for timeString
timeSlotSchema.virtual("timeString").get(function (this: TimeSlot) {
  const startHour = Math.floor(this.startTime / 60);
  const startMinute = this.startTime % 60;
  const endHour = Math.floor(this.endTime / 60);
  const endMinute = this.endTime % 60;

  const startAMPM = startHour >= 12 ? "PM" : "AM";
  const endAMPM = endHour >= 12 ? "PM" : "AM";

  const formattedStartHour = startHour % 12 || 12;
  const formattedEndHour = endHour % 12 || 12;

  const formattedStartTime = `${formattedStartHour}:${startMinute
    .toString()
    .padStart(2, "0")} ${startAMPM}`;
  const formattedEndTime = `${formattedEndHour}:${endMinute
    .toString()
    .padStart(2, "0")} ${endAMPM}`;

  return `${formattedStartTime} - ${formattedEndTime}`;
});

const TimeSlotModel = model<TimeSlot>("TimeSlot", timeSlotSchema);

export default TimeSlotModel;
