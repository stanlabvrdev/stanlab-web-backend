import moment from "moment";
import mongoose from "mongoose";
import { LabExperiment } from "../../../models/labAssignment";

export async function createLab(teacherId: string, is_teacher: boolean = true) {
  const data = {
    experiment: {
      _id: new mongoose.Types.ObjectId().toHexString(),
      name: "test experiment",
      class: new mongoose.Types.ObjectId().toHexString(),
      subject: "test-subject",
      code: "004",
      icon: "image-url",
      practicalName: "pr-name",
      demoVideoUrl: "demo.url",
      label: "label-001",
    },
    classId: new mongoose.Types.ObjectId().toHexString(),
    dueDate: moment().add(7, "days").format("YYYY-MM-DD"),
    instruction: "some instruction",
    startDate: moment().add(1, "days").format("YYYY-MM-DD"),
    isCompleted: false,
    student: new mongoose.Types.ObjectId().toHexString(),
    teacher: is_teacher ? teacherId : null,
  };

  const lab = new LabExperiment(data);

  return lab.save();
}
