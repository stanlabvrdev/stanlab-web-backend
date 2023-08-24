import {
  findAndRemove,
  getRandomElement,
  hasSubjectBeenAssignedToday,
  hashString,
  isThereConflict,
  timeRangeFree,
} from "./utilities";
import { Activity, Data, TimeSlot } from "./classes";

class TimetableBuilder {
  data: Data;

  constructor(data: Data) {
    this.data = data;
  }

  private initializeTimetableSlots(timetable: Record<string, any>): void {
    for (const eachClass of this.data.Classes) {
      timetable[eachClass.classid] = Object.fromEntries(this.data.Days.map((day) => [day, []]));
    }
  }

  private handleFixedActivities(timetable: Record<string, TimeSlot[]>): void {
    for (const eachClass of Object.keys(timetable)) {
      for (const day of Object.keys(timetable[eachClass])) {
        for (const activity of this.data.Activities) {
          if (activity.isTimeFixed && activity.TimeRange) {
            timetable[eachClass][day].push({
              [activity.TimeRange]: new TimeSlot(
                activity.name,
                eachClass,
                activity.color,
                activity.Teacher || undefined
              ),
            });
          }
        }
      }
    }
  }

  buildTimetable(): Record<string, TimeSlot[]> {
    const timetable: Record<string, any> = {};
    //Validate data to ensure that there are no duplicate time ranges - do this in payload area
    //Initialise timetable slots for each class
    this.initializeTimetableSlots(timetable);
    this.handleFixedActivities(timetable);
    const unfixedActivities = this.data.Activities.filter((activity) => !activity.isTimeFixed);
    this.assignUnfixedActivities(timetable, unfixedActivities);

    return timetable;
  }

  assignUnfixedActivities(timetable: Record<string, any>, activities: Activity[]) {
    const days = this.data.Days;
    const timeRanges = this.data.TimeRanges;

    const activityQueueHashMap = activities.map((activity) =>
      hashString(`${activity.Teacher}-${activity.name}`)
    );

    const classKeys = Object.keys(timetable);
    for (let classIndex = 0; classIndex < classKeys.length; classIndex++) {
      const currClass = classKeys[classIndex];
      const isFirstClass = classIndex === 0;
      const dayTimetable = timetable[currClass];

      for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const day = days[dayIndex];
        const isAssignedToday: string[] = [];
        let assignablePool: string[] = [...activityQueueHashMap];

        for (let timeRangeIndex = 0; timeRangeIndex < timeRanges.length; timeRangeIndex++) {
          const timeRange = timeRanges[timeRangeIndex];
          let isAssigned = false;

          function assignActivityRecursively(assignablePool: string[]) {
            if (assignablePool.length === 0) assignablePool = activityQueueHashMap;
            if (isAssigned) return;

            const tentativeActivity = getRandomElement(assignablePool)!;
            const activityIndex = activityQueueHashMap.indexOf(tentativeActivity);
            const activity = activities[activityIndex];

            if (
              !hasSubjectBeenAssignedToday(tentativeActivity, isAssignedToday) &&
              timeRangeFree(timeRange, dayTimetable[day]) &&
              (isFirstClass || !isThereConflict(timeRange, activity, timetable, day))
            ) {
              const parsedTimeSlot = new TimeSlot(
                activity.name,
                currClass,
                activity.color,
                activity.Teacher || undefined
              );
              dayTimetable[day].push({ [timeRange]: parsedTimeSlot });

              findAndRemove(assignablePool, tentativeActivity);
              isAssignedToday.push(tentativeActivity);
              isAssigned = true;
              if (assignablePool.length === 0) assignablePool = activityQueueHashMap;
              return; // Successful assignment
            } else {
              if (assignablePool.length === 0 && !isAssigned) {
                const parsedTimeSlot = new TimeSlot("", currClass, "", undefined);
                dayTimetable[day].push({ [timeRange]: parsedTimeSlot });
              }
              isAssigned = true;
              assignActivityRecursively(assignablePool); // Retry with another random element
            }
          }

          // Call the recursive function with initial parameters
          assignActivityRecursively(assignablePool);
        }
      }
    }
  }
}

export default TimetableBuilder;
//Free periods?????????????????
