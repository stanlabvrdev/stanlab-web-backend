import { createHash } from "node:crypto";
import { Activity, TimeSlot } from "./classes";

export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export function hashString(input: string): string {
  const hash = createHash("sha256");
  hash.update(input);
  return hash.digest("hex");
}

export const hasSubjectBeenAssignedToday = function (
  activityHash: string,
  assignedToday: string[]
) {
  return assignedToday.includes(activityHash);
};

export function timeRangeFree(timeRange: string, dayTable: any[]) {
  /*
     [{
            timeRange: {
                activity....
            }
        }]
    */
  return !dayTable.map((each) => Object.keys(each)[0]).includes(timeRange);
}

export function findAndRemove<T>(array: T[], element: T): T[] {
  const index = array.indexOf(element);
  if (index !== -1) {
    array.splice(index, 1);
  }
  return array;
}

export function isThereConflict(
  timerange: string,
  activity: Activity,
  timetable: Record<string, TimeSlot[]>,
  day: string
): boolean {
  for (const [_, classSchedule] of Object.entries(timetable)) {
    const actOnTime: { teacher: string; subject: string } = classSchedule[day].find(
      (each) => Object.keys(each)[0] == timerange
    );
    if (actOnTime && Object.values(actOnTime)[0]["teacher"] == activity.Teacher?.name) return true;
  }
  return false;
}
