import TimetableModel from "../../models/timetable";
import TimeSlotModel from "../../models/timeslots";
import TimetableBuilder from "./generator";
import { Activity, Data, EachClass, Teacher } from "./classes";
import { Day, IModifyTimetableMetadata, ISaveGroup } from "./timetable.dto";
import { ClientSession, ObjectId, Types, startSession } from "mongoose";
import { TimeSlot } from "../../models/timeslots";
import NotFoundError from "../exceptions/not-found";
import TimetableGroupModel from "../../models/timetable-group";
import { SchoolAdmin } from "../../models/schoolAdmin";
import { Student } from "../../models/student";
import { SchoolTeacher } from "../../models/schoolTeacher";
import { Profile } from "../../models/profile";
import { Teacher as TeacherModel } from "../../models/teacher";
import {
  privateTeacherAddedToSchoolAccount,
  teachersGetStartedEmail,
  welcomeNewTeacher,
} from "../email";
import { passwordService } from "../passwordService";
import generateRandomString from "../../utils/randomStr";
import BadRequestError from "../exceptions/bad-request";

class TimeTableService {
  async generate(
    grade: string,
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
    return this.formatCreateResponse(grade, timetable, classes, timeRanges, days);
  }

  private formatCreateResponse(
    grade: string,
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
      grade,
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
    const group = await TimetableGroupModel.create(
      [{ admin, name: timetableGroup.groupName, grade: timetableGroup.grade }],
      {
        session,
      }
    );
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
    const teachers = new Set();
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

      const timetableTeachers = timeSlots.map((timeslots) => timeslots.teacherName);
      timetableTeachers.forEach(teachers.add, teachers);

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
      grade: group.grade,
      periods: Array.from(periods),
      days: Array.from(days),
      teachers: Array.from(teachers),
      data: formattedTimetables,
    };
  }
  async getAllTimetables(admin: string) {
    const timetables = await TimetableModel.find({ admin });
    return await Promise.all(
      timetables.map(async (timetable) => {
        const timeslots = await TimeSlotModel.find({ timetable: timetable._id });
        const periods = new Set(timeslots.map((timeSlot) => timeSlot.timeSlot)).size;
        const subjects = new Set(timeslots.map((timeSlot) => timeSlot.subject)).size;
        const group = await TimetableGroupModel.findOne({ _id: timetable.group });
        return {
          grade: group?.grade ?? "Not Specified",
          class: timetable.className,
          subjects,
          periods,
        };
      })
    );
  }

  async getATimetable(admin: string, timetable: string) {
    const ttable = await TimetableModel.findOne({ _id: timetable, admin });
    if (!ttable) throw new NotFoundError("Timetable not found");
    const timeSlots = await TimeSlotModel.find({ timetable: ttable._id });

    const days = new Set(timeSlots.map((timeSlot) => timeSlot.day));
    const periods = new Set(timeSlots.map((timeSlot) => timeSlot.timeSlot));
    const teachers = new Set(timeSlots.map((timeSlot) => timeSlot.teacherName));

    const formattedData = {
      classid: ttable.class,
      className: ttable.className,
      timetable: {},
    };

    for (let day of Array.from(days)) {
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
    const group = await TimetableGroupModel.findOne({ _id: ttable.group });
    return {
      name: ttable.timeTableName,
      id: timetable,
      grade: group?.grade ?? "Not Specified",
      periods: Array.from(periods),
      days: Array.from(days),
      teachers: Array.from(teachers),
      data: formattedData,
    };
  }

  async deleteTimetable(admin: string, ttable: string) {
    const session = await this.startTransaction();
    try {
      const timetable = await TimetableModel.findOne({ _id: ttable, admin });
      if (!timetable) throw new NotFoundError("Timetable not found");
      await TimeSlotModel.deleteMany({ timetable: timetable._id }, { session });
      await TimetableModel.deleteOne({ _id: ttable, admin }, { session });
      await this.commitTransaction(session);
    } catch (err) {
      await this.abortTransaction(session);
      throw err;
    }
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
          grade: group.grade,
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

  async generateShareablelink(groupId: string, admin: string) {
    const baseURL = "https://app.stanlab.co/share/";
    const group = await TimetableGroupModel.findOne({ _id: groupId, admin });
    if (!group) throw new NotFoundError("Timetable not found");
    if (group.shareId) return `${baseURL}${group.shareId}`;
    let isUnique: boolean = false;
    let shareId: string = "";
    while (!isUnique) {
      shareId = Date.now().toString(36);
      const existingGroup = await TimetableGroupModel.findOne({ shareId });
      if (!existingGroup) isUnique = true;
    }
    await TimetableGroupModel.updateOne({ _id: groupId, admin }, { shareId });
    return `${baseURL}${shareId}`;
    //TODO: Add a max loop count to prevent infinite loop, though unlikely
  }

  async getSharedTimetable(shareId: string) {
    const group = await TimetableGroupModel.findOne({ shareId });
    if (!group) throw new NotFoundError("Resource not found");
    return await this.getGroup(group._id, String(group.admin));
  }

  async addTeachersToTimetable(
    admin: string,
    teachers: { name: string; email: string }[],
    timetable: string
  ) {
    const group = await TimetableGroupModel.findOne({ _id: timetable, admin });
    if (!group) throw new NotFoundError("Timetable group not found");
    const timetables = await TimetableModel.find({ group: timetable, admin });
    const timeSlots = await TimeSlotModel.find({
      timetable: { $in: timetables.map((t) => t._id) },
    });
    const errors: string[] = [];
    const success: string[] = [];
    for (const teacher of teachers) {
      const timeSlotWithTeacher = timeSlots.filter(
        (timeSlot) => timeSlot.teacherName === teacher.name
      );
      if (timeSlotWithTeacher.length == 0) {
        errors.push(
          `${teacher.name} was not added because ${teacher.name} is not a teacher in this timetable`
        );
        continue;
      }
      const session = await this.startTransaction();
      try {
        const teacherId = await this.addTeacherToSchool(admin, teacher, session);
        await Promise.all(
          timeSlotWithTeacher.map((slot) => slot.updateOne({ teacher: teacherId }, { session }))
        );
        //Send notification here
        await this.commitTransaction(session);
        success.push(teacher.name + " was added successfully");
      } catch (err: any) {
        await this.abortTransaction(session);
        errors.push(`${teacher.name} was not added, the following error occured: ${err.message}`);
      }
    }

    if (success.length == 0) throw new BadRequestError("No teacher was added");
    return { success, errors };
  }

  private async emailExists(email: string) {
    const existingUsers = await Promise.all([
      SchoolAdmin.findOne({ email }),
      Student.findOne({ email }),
    ]);
    return existingUsers.some((user) => user);
  }

  private async addExistingTeacherToSchool(teacher: any, school: string, session: ClientSession) {
    await teacher.updateOne({ schoolTeacher: true }, { session });

    await SchoolTeacher.create([{ school, teacher: teacher._id }], { session });

    await Profile.create([{ teacher: teacher._id, selectedSchool: school }], { session });
  }

  private async saveNewTeacher(
    password: string,
    teacher: { name: string; email: string },
    school: string,
    session: ClientSession
  ) {
    const newTeacher = await TeacherModel.create(
      [
        {
          name: teacher.name,
          email: teacher.email,
          password: await passwordService.hash(password),
          schoolTeacher: true,
        },
      ],
      { session }
    );
    await SchoolTeacher.create([{ school, teacher: newTeacher[0]._id }], { session });
    await Profile.create([{ teacher: newTeacher[0]._id, selectedSchool: school }], { session });
    return newTeacher[0]._id;
  }
  private async startTransaction() {
    const session = await startSession();
    session.startTransaction();
    return session;
  }

  private async commitTransaction(session: ClientSession) {
    await session.commitTransaction();
    session.endSession();
  }

  private async abortTransaction(session: ClientSession) {
    await session.abortTransaction();
    session.endSession();
  }

  //More robust and thought out implementation - can be used to refactor other similar implementations
  async addTeacherToSchool(
    admin: string,
    teacher: { name: string; email: string },
    session: ClientSession
  ): Promise<string> {
    const schoolAdmin = await SchoolAdmin.findOne({ _id: admin });
    if (!schoolAdmin) throw new NotFoundError("School not found");

    if (await this.emailExists(teacher.email)) throw new BadRequestError("Email already exists");
    const teacherExists = await TeacherModel.findOne({ email: teacher.email });

    const isSchoolTeacher = await SchoolTeacher.findOne({
      school: admin,
      teacher: teacherExists ? teacherExists._id : undefined,
    });

    if (teacherExists && isSchoolTeacher) return teacherExists._id;
    if (teacherExists && !isSchoolTeacher) {
      await this.addExistingTeacherToSchool(teacherExists, admin, session);
      privateTeacherAddedToSchoolAccount(teacherExists, schoolAdmin.schoolName);
      return teacherExists._id;
    }
    const password = generateRandomString(7);
    const newTeacherID = await this.saveNewTeacher(password, teacher, admin, session);
    welcomeNewTeacher(teacher, password);
    teachersGetStartedEmail(teacher);
    return newTeacherID;
  }
}

const timetableService = new TimeTableService();
export { timetableService };
