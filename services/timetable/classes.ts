export class Teacher {
  teacherid: string;
  name: string;

  constructor(teacherid: string, name: string) {
    this.teacherid = teacherid;
    this.name = name;
  }
}

export class Activity {
  isTimeFixed: boolean;
  TimeRange: string | undefined;
  Teacher: Teacher | undefined;
  name: string;
  color: string;

  constructor(
    isFixed: boolean,
    name: string,
    color: string,
    TimeRange?: string,
    Teacher?: Teacher
  ) {
    this.isTimeFixed = isFixed;
    this.TimeRange = TimeRange;
    this.Teacher = Teacher;
    this.name = name;
    this.color = color;
  }
}

export class EachClass {
  classid: string;
  classname: string;

  constructor(classid: string, classname: string) {
    this.classid = classid;
    this.classname = classname;
  }
}

export class Data {
  Classes: EachClass[];
  TimeRanges: string[];
  Days: string[];
  Activities: Activity[];

  constructor(Classes: EachClass[], TimeRanges: string[], Days: string[], Activities: Activity[]) {
    this.Classes = Classes;
    this.TimeRanges = TimeRanges;
    this.Days = Days;
    this.Activities = Activities;
  }
}

export class TimeSlot {
  teacherName?: string;
  teacherid?: string;
  activity: string;
  className: string;
  color: string;

  constructor(activity: string, className: string, color: string, teacher?: Teacher) {
    if (teacher) {
      this.teacherid = teacher.teacherid;
      this.teacherName = teacher.name;
    }
    this.activity = activity;
    this.className = className;
    this.color = color;
  }
}
