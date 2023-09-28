import { faker } from "@faker-js/faker";
import TimetableModel from "../../../models/timetable";
import TimeSlotModel from "../../../models/timeslots";
import TimetableGroupModel from "../../../models/timetable-group";

export const invalidData = {
  // grade: `${faker.lorem.word()}`,
  grades: [
    { gradeName: "Grade 1", numberOfVariations: 2 },
    { gradeName: " Grade 2", numberOfVariations: 3 },
  ],
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  //   timeRanges: ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"],
  activities: [
    {
      isTimeFixed: false,
      name: `${faker.lorem.word()}`,
      color: `${faker.lorem.word()}`,
      Teacher: { id: "1", name: `${faker.lorem.word()}` },
    },
    {
      isTimeFixed: false,
      name: `${faker.lorem.word()}`,
      color: `${faker.lorem.word()}`,
      Teacher: { id: "2", name: `${faker.lorem.word()}` },
    },
    {
      isTimeFixed: true,
      name: `${faker.lorem.word()}`,
      color: `${faker.lorem.word()}`,
      TimeRange: "8:00-9:00",
    },
  ],
};
export const validData = {
  timeRanges: ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"],
  ...invalidData,
};

export const saveTimetableFake = {
  timetables: [
    {
      className: faker.lorem.word(),
      days: [
        {
          name: "Monday",
          timeslots: [
            {
              name: faker.lorem.word(),
              teacherID: "64f5b75925b92b109c3aaed9",
              color: faker.lorem.word(),
              timeRange: "10-11",
            },
            {
              name: faker.lorem.word(),
              teacherName: faker.lorem.word(),
              color: faker.lorem.word(),
              timeRange: "10-11",
            },
          ],
        },
        {
          name: "Tuesday",
          timeslots: [
            {
              name: faker.lorem.word(),
              teacherName: faker.lorem.word(),
              color: faker.lorem.word(),
              timeRange: "10-11",
            },
            {
              name: faker.lorem.word(),
              teacherName: faker.lorem.word(),
              color: faker.lorem.word(),
              timeRange: "10-11",
            },
          ],
        },
      ],
    },
  ],
};

export const createTimetableFake = async (schoolID: string) => {
  const group = await TimetableGroupModel.create({
    grade: faker.lorem.word(),
    name: faker.lorem.word(),
    admin: schoolID,
  });
  const timetable = await TimetableModel.create({
    timeTableName: faker.lorem.word(),
    classID: "64f5b75925b92b109c3aaed9",
    className: faker.lorem.word(),
    admin: schoolID,
    group: group._id,
  });
  const timeslot1 = await TimeSlotModel.create({
    day: "Monday",
    timetable: timetable._id,
    timeSlot: "10-11",
    teacher: "64f5b75925b92b109c3aaed9",
    subject: faker.lorem.word(),
    teacherName: faker.lorem.word(),
    color: faker.lorem.word(),
  });

  const timeslot2 = await TimeSlotModel.create({
    day: "Tuesday",
    timetable: timetable._id,
    timeSlot: "9-12",
    teacher: "64f5b75925b92b109c3aaed9",
    subject: faker.lorem.word(),
    teacherName: faker.lorem.word(),
    color: faker.lorem.word(),
  });

  return { timetable, timeslot1, timeslot2, group };
};
