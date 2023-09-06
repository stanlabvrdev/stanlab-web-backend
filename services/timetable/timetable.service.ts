import TimetableModel from "../../models/timetable";
import TimeSlotModel from "../../models/timeslots";
import TimetableBuilder from "./generator";
import { Activity, Data, EachClass, Teacher } from "./classes";
import { Day, IModifyTimetableMetadata, ISaveGroup } from "./timetable.dto";
import { ClientSession, ObjectId, Types, startSession } from "mongoose";
import { TimeSlot } from "../../models/timeslots";
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
      const { timeSlotObjects, savedTimetables, groupId } = await this.createTimetables(
        group,
        adminId,
        session
      );
      await TimeSlotModel.insertMany(timeSlotObjects, { session });
      await session.commitTransaction();
      session.endSession();
      return { groupId, savedTimetables };
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

    return { timeSlotObjects, savedTimetables, groupId: group[0]._id };
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

  async getGroup(groupId: string, admin: string) {
    const group = await TimetableGroupModel.findOne({ _id: groupId, admin });
    if (!group) throw new NotFoundError("Timetable group not found");

    const timeTables = await TimetableModel.find({ group: groupId, admin });
    const days = new Set();
    const periods = new Set();
    const formattedTimetables: {
      classid: Types.ObjectId;
      className: string | undefined;
      timetable: {};
    }[] = [];
    for (let timeTable of timeTables) {
      const timeSlots = await TimeSlotModel.find({ timetable: timeTable._id });

      const timetableDays = timeSlots.map((timeSlot) => timeSlot.day);
      timetableDays.forEach((day) => days.add(day));

      const timetablePeriods = timeSlots.map((timeSlot) => timeSlot.timeSlot);
      timetablePeriods.forEach(periods.add, periods);

      const formattedData = {
        classid: timeTable.class,
        className: timeTable.className,
        timetable: {},
      };

      for (let day of Array.from(timetableDays)) {
        formattedData.timetable[day] = [];
        timeSlots
          .filter((timeSlot) => timeSlot.day === day)
          .forEach((timeSlot) => {
            formattedData.timetable[day].push({
              timeSlot: timeSlot.timeSlot,
              teacher: timeSlot.teacher,
              subject: timeSlot.subject,
              teacherName: timeSlot.teacherName,
              color: timeSlot.color,
            });
          });
      }
      formattedTimetables.push(formattedData);
    }
    return {
      name: group.name,
      id: group._id,
      periods: Array.from(periods),
      days: Array.from(days),
      data: formattedTimetables,
    };
  }

  async getGroups(admin: string) {
    const groups = await TimetableGroupModel.find({ admin });

    const groupsDetails = await Promise.all(
      groups.map(async (group) => {
        const timetables = await TimetableModel.find({ group: group._id });
        const timeSlots = await TimeSlotModel.find({
          timetable: { $in: timetables.map((t) => t._id) },
        });

        const teachers = new Set(timeSlots.map((timeSlot) => timeSlot.teacher)).size;
        const periods = new Set(timeSlots.map((timeSlot) => timeSlot.timeSlot)).size;
        const subjects = new Set(timeSlots.map((timeSlot) => timeSlot.subject)).size;

        return {
          name: group.name,
          teachers,
          periods,
          subjects,
          id: group._id,
        };
      })
    );

    return groupsDetails;
  }

  async modifyGroupMetadata(groupId: string, admin: string, data: IModifyTimetableMetadata) {
    const group = await TimetableGroupModel.findOne({ _id: groupId, admin });
    if (!group) throw new NotFoundError("Timetable not found");
    //Check that the collaborators exist is not neccessary because the check will occur when trying to access the timetable
    const updatedGroup = await TimetableGroupModel.findOneAndUpdate(
      { _id: groupId, admin },
      { $set: data },
      { new: true }
    );
    return updatedGroup;
  }

  async deleteGroup(group: string, admin: string) {
    const session = await startSession();
    session.startTransaction();
    try {
      const timeTable = await TimetableGroupModel.findOne({ _id: group, admin });
      if (!timeTable) throw new NotFoundError("Timetable not found");

      const timetables = await TimetableModel.find({ group, admin });
      for (let timetable of timetables) {
        await TimeSlotModel.deleteMany({ timetable: timetable._id }, { session });
      }

      await TimetableModel.deleteMany({ group: group }, { session });
      await TimetableGroupModel.deleteOne({ _id: group }, { session });
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
