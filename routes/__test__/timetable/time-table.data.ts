import { faker } from "@faker-js/faker";

export const invalidData = {
  classes: [
    { classid: "1", classname: `${faker.lorem.word()}` },
    { classid: "2", classname: `${faker.lorem.word()}` },
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
