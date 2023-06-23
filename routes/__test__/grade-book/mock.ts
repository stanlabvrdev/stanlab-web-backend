import moment from "moment";
import mongoose from "mongoose";
import { LabExperiment } from "../../../models/labAssignment";
import { TeacherClass } from "../../../models/teacherClass";

import { faker } from "@faker-js/faker";
import { StudentScore } from "../../../models/studentScore";
import { StudentTeacherClass } from "../../../models/teacherStudentClass";

export async function createExperiment(teacherId: string, classId: string, studentId: string) {
  const data = {
    experiment: {
      _id: new mongoose.Types.ObjectId(),
      name: "test experiment",
      class: new mongoose.Types.ObjectId(),
      subject: "test-subject",
      code: "004",
      icon: "image-url",
      practicalName: "pr-name",
      demoVideoUrl: "demo.url",
      label: "label-001",
    },
    classId: classId,
    dueDate: moment().add(7, "days").format("YYYY-MM-DD"),
    instruction: "some instruction",
    startDate: moment().add(1, "days").format("YYYY-MM-DD"),
    isCompleted: false,
    student: studentId,
    teacher: teacherId,
  };

  const lab = new LabExperiment(data);

  return lab.save();
}

export async function createScore(teacherId: string, studentId: string, classId: string, experimentId: string) {
  const data = {
    classId: classId,
    experimentId: experimentId,
    studentId: studentId,
    teacherId: teacherId,
    score: 10,
    isCompleted: true,
  };

  const score = new StudentScore(data);

  return score.save();
}

export async function createClass(teacherId: string, studentId: string) {
  const data = {
    title: faker.company.name(),
    subject: faker.fake.name,
    section: "test section",
  };

  const tclass = new TeacherClass(data);

  const teacherClass = new StudentTeacherClass({
    teacher: teacherId,
    student: studentId,
    class: tclass._id,
  });

  const createdTc = await teacherClass.save();
  const createdClass = await tclass.save();

  return {
    teacher_student_class: createdTc,
    class_data: createdClass,
  };
}
