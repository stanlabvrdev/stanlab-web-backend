import Joi from "joi";
import { Types } from "mongoose";
import { TimetablePublishStatus } from "../../models/timetable-group";
import { WeekDays } from "../../models/timeslots";

const extendedJOI = Joi.extend((joi) => ({
  type: "objectId",
  base: joi.string(),
  messages: {
    "objectId.invalid": "Invalid ObjectId format",
  },
  validate(value, helpers) {
    if (!Types.ObjectId(value)) {
      return { value, errors: helpers.error("objectId.invalid") };
    }
  },
}));

const teacherSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
});

const activitySchema = Joi.object({
  isTimeFixed: Joi.boolean().required(),
  TimeRange: Joi.string().when("isTimeFixed", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  Teacher: teacherSchema.when("isTimeFixed", {
    is: false,
    then: teacherSchema.required(),
    otherwise: teacherSchema.optional(),
  }),
  name: Joi.string().required(),
  color: Joi.string().required(),
});

export const scheduleSchema = Joi.object({
  grade: Joi.string().required(),
  classes: Joi.array()
    .items(
      Joi.object({
        classid: Joi.string().required(),
        classname: Joi.string().required(),
      })
    )
    .required(),
  days: Joi.array()
    .items(
      Joi.string().valid(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      )
    )
    .required(),
  timeRanges: Joi.array().items(Joi.string()).required(),
  activities: Joi.array().items(activitySchema).required(),
});

const saveActivitySchema = Joi.object({
  name: Joi.string().required(),
  teacherID: extendedJOI.objectId(),
  teacherName: Joi.string(),
  color: Joi.string().required(),
  timeRange: Joi.string().required(),
});

const daySchema = Joi.object({
  name: Joi.string().required(),
  timeslots: Joi.array().items(saveActivitySchema).min(1).required(),
});

export const saveTimetableSchema = Joi.object({
  groupName: Joi.string().optional(),
  grade: Joi.string().required(),
  timetables: Joi.array().items(
    Joi.object({
      name: Joi.string().optional(),
      classID: extendedJOI.objectId().optional(),
      className: Joi.string().optional(),
      days: Joi.array().items(daySchema).min(1).required(),
    })
  ),
});

export interface SaveActivity {
  name: string;
  teacherID?: string;
  teacherName?: string;
  color: string;
  timeRange: string;
}

export interface Day {
  name: WeekDays;
  timeslots: SaveActivity[];
}

export interface IsaveTimetable {
  name?: string;
  classID?: string;
  className?: string;
  days: Day[];
}

export interface ISaveGroup {
  groupName: string;
  grade: string;
  timetables: IsaveTimetable[];
}

export const modifyTimetableMetadata = Joi.object({
  name: Joi.string().optional(),
  collaborators: Joi.array().items(extendedJOI.objectId()).optional(),
  published: Joi.string()
    .valid(TimetablePublishStatus.Published, TimetablePublishStatus.Draft)
    .optional(),
});

export interface IModifyTimetableMetadata {
  name?: string;
  collaborators?: Types.ObjectId[];
  published?: TimetablePublishStatus;
}
const teacherInfo = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
});

export const addTeachersDto = Joi.object({
  teachers: Joi.array().items(teacherInfo).required(),
});
