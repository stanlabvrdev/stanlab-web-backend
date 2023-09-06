import TimetableModel from "../../models/timetable";
import TimeSlotModel from "../../models/timeslots";
import TimetableBuilder from "./generator";
import { Activity, Data, EachClass, Teacher } from "./classes";
import {
  Day,
  IModifyTimetableMetadata,
  ISaveGroup,
  IsaveTimetable,
  SaveActivity,
} from "./timetable.dto";
import { ClientSession, ObjectId, Types, startSession } from "mongoose";
import { TimeSlot } from "../../models/timeslots";
import { TeacherClass } from "../../models/teacherClass";
import NotFoundError from "../exceptions/not-found";
import TimetableGroupModel from "../../models/timetable-group";

class TimeTableService {
  async generate(
    classes: EachClass[],
    days: string[],
    timeRanges: string[],
    activities: Activity[]
  ) {
    const allClasses = classes.map(
      (eachClass) => new EachClass(eachClass.classid, eachClass.classname)
    );
    const allActivities = activities.map((activity) => {
      const teacher = activity.Teacher
        ? new Teacher(activity.Teacher.teacherid, activity.Teacher.name)
        : undefined;

      return new Activity(
        activity.isTimeFixed,
        activity.name,
        activity.color,
        (activity.isTimeFixed && activity.TimeRange) || undefined,
        teacher
      );
    });
    const data = new Data(allClasses, timeRanges, days, allActivities);
    const timetable = new TimetableBuilder(data).buildTimetable();
    return this.formatCreateResponse(timetable, classes, timeRanges, days);
  }

  private formatCreateResponse(
    timetable: any,
    classes: EachClass[],
    timeRanges: string[],
    days: string[]
  ) {
    const formattedData: any = [];
    Object.keys(timetable).forEach((classid) => {
      formattedData.push({
        classid,
        className: classes.find((eachClass) => eachClass.classid === classid)?.classname,
        timetable: timetable[classid],
      });
    });
    const finalData = {
      name: `Timetable-${Date.now()}`,
      periods: timeRanges,
      days,
      data: formattedData,
    };
    return finalData;
  }

  async save(group: ISaveGroup, adminId: string) {
    const session = await startSession();
    session.startTransaction();
    try {
      const { timeSlotObjects, savedTimetables } = await this.createTimetables(
        group,
        adminId,
        session
      );
      await TimeSlotModel.insertMany(timeSlotObjects, { session });
      await session.commitTransaction();
      session.endSession();
      return savedTimetables;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async createTimetables(timetableGroup: ISaveGroup, admin: string, session: ClientSession) {
    const timeSlotObjects: Partial<TimeSlot>[] = [];
    const timetables = timetableGroup.timetables;
    const group = await TimetableGroupModel.create([{ admin, name: timetableGroup.groupName }], {
      session,
    });
    const savedTimetables: { id: string; name: string }[] = [];
    for (let timetable of timetables) {
      const newTimetable = await TimetableModel.create(
        [
          {
            timeTableName: timetable.name,
            classID: timetable.classID,
            className: timetable.className,
            admin,
            group: group[0]._id,
          },
        ],
        { session }
      );
      savedTimetables.push({ id: newTimetable[0]._id, name: newTimetable[0].timeTableName });
      timeSlotObjects.push(...this.createTimeslots(newTimetable[0]._id, timetable.days));
    }
    return { timeSlotObjects, savedTimetables };
  }

  createTimeslots(timetable: string, days: Day[]) {
    const timeSlotObjects: Partial<TimeSlot>[] = [];
    for (let day of days) {
      const timeslots = day.timeslots;
      timeSlotObjects.push(
        ...timeslots.map((timeslot) => {
          return {
            day: day.name,
            timetable: timetable as unknown as ObjectId,
            timeSlot: timeslot.timeRange,
            teacher: timeslot.teacherID,
            subject: timeslot.name,
            teacherName: timeslot.teacherName,
            color: timeslot.color,
          };
        })
      );
    }
    return timeSlotObjects;
  }

  async getTimetable(timetableId: string, admin: string) {
    const timeTable = await TimetableModel.findOne({ _id: timetableId, admin });
    if (!timeTable) throw new Error("Timetable not found");
    const timeSlots = await TimeSlotModel.find({ timetable: timetableId });
    const days = new Set(timeSlots.map((timeSlot) => timeSlot.day));
    const periods = new Set(timeSlots.map((timeSlot) => timeSlot.timeSlot));
    //How do I get the days, and then the periods and then group the timeslots by each day?
    const formattedData = {
      days: Array.from(days),
      periods: Array.from(periods),
      data: {
        classid: timeTable.class,
        className: timeTable.className,
        timetable: {},
      },
    };
    for (let day of Array.from(days)) {
      formattedData.data.timetable[day] = [];
      timeSlots
        .filter((timeSlot) => timeSlot.day === day)
        .forEach((timeSlot) => {
          formattedData.data.timetable[day].push({
            timeSlot: timeSlot.timeSlot,
            teacher: timeSlot.teacher,
            subject: timeSlot.subject,
            teacherName: timeSlot.teacherName,
            color: timeSlot.color,
          });
        });
    }
    return formattedData;
  }

  async getTimetables(admin: string) {
    const timetables = await TimetableModel.find({ admin });
    const timeSlotsGroup = await Promise.all(
      timetables.map((timetable) => {
        return TimeSlotModel.find({ timetable: timetable._id });
      })
    );
    const timetableDetails = timeSlotsGroup.map((timeSlots) => {
      const teachers = new Set(
        timeSlots.map((timeSlot) => {
          if (timeSlot.teacherName) return timeSlot.teacherName;
          return timeSlot.teacher;
        })
      ).size;
      const periods = new Set(timeSlots.map((timeSlot) => timeSlot.timeSlot)).size;
      const subjects = new Set(timeSlots.map((timeSlot) => timeSlot.subject)).size;
      return {
        teachers,
        periods,
        subjects,
      };
    });

    return timetables.map((timetable, index) => {
      const subjects = timetableDetails[index].subjects;
      const teachers = timetableDetails[index].teachers;
      const periods = timetableDetails[index].periods;
      return { name: timetable.timeTableName, subjects, teachers, periods };
    });
  }

  async modifyTimetableMetadata(timetable: string, admin: string, data: IModifyTimetableMetadata) {
    const timeTable = await TimetableModel.findOne({ _id: timetable, admin });
    if (!timeTable) throw new NotFoundError("Timetable not found");
    if (data.class) {
      const classExist = await TeacherClass.findOne({ _id: data.class, school: admin });
      if (!classExist) throw new NotFoundError("Class not found");
    }
    //Check that the collaborators exist is not neccessary because the check will occur when trying to access the timetable
    const updatedTimetable = await TimetableModel.findOneAndUpdate(
      { _id: timetable, admin },
      { $set: data },
      { new: true }
    );
    return updatedTimetable;
  }

  async deleteTimetable(timetable: string, admin: string) {
    const session = await startSession();
    session.startTransaction();
    try {
      const timeTable = await TimetableModel.findOne({ _id: timetable, admin });
      if (!timeTable) throw new NotFoundError("Timetable not found");
      await TimeSlotModel.deleteMany({ timetable, session });
      await TimetableModel.deleteOne({ _id: timetable, session });

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}

const timetableService = new TimeTableService();
export { timetableService };
