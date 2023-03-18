const { Student } = require("../../models/student");

export async function generateUserName(first_name, last_name) {
  let count = 1;
  let userName = `${first_name}${last_name}-00${count}`;
  let students = await Student.find({ userName });

  while (students && students.length > 0) {
    count++;
    userName = `${first_name}${last_name}-00${count}`;
    students = await Student.find({ userName });
  }
  return userName;
}

export function getFullName(first_name, last_name) {
  return `${first_name} ${last_name}`;
}

export default {
  generateUserName,
  getFullName,
};
