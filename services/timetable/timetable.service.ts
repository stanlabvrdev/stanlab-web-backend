import TimetableModel from "../../models/timetable";
import TimeSlotModel from "../../models/timeslots";
import TimetableBuilder from "./generator";
import { Activity, Data, EachClass, Teacher } from "./classes";

class TimeTableService {
  async create(classes: EachClass[], days: string[], timeRanges: string[], activities: Activity[]) {
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
      periods: timeRanges,
      days,
      data: formattedData,
    };
    return finalData;
  }
}

const timetableService = new TimeTableService();
export { timetableService as TimeTableService };
