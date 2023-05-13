import { CreateLabAssignment, Filter, ILabExperiment, LabExperiment } from "../../models/labAssignment";
import { Profile } from "../../models/profile";
import { Student } from "../../models/student";
import { StudentScore } from "../../models/studentScore";
import systemExperiments, { SystemExperiment } from "../../models/systemExperiments";
import { Teacher } from "../../models/teacher";
import { TeacherClass } from "../../models/teacherClass";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import NotFoundError from "../exceptions/not-found";
import { createAssignedLabNotification } from "../student/notification";

class LabAssignmentService {
  async assign(data: CreateLabAssignment) {
    const experimentId = data.experiment_id;
    const teacher = await Teacher.findOne({ _id: data.teacher_id });

    const experiment = await systemExperiments.findOne({ _id: experimentId });

    if (!experiment) throw new NotFoundError("experiment not found");

    let teacherClass;
    let teacherstudents;
    const promises: any[] = [];

    const profile = await Profile.findOne({ teacher: data.teacher_id });

    const teacherCurrentSchool = profile?.selectedSchool;

    teacherClass = await TeacherClass.findOne({
      _id: data.class_id,
      school: teacherCurrentSchool,
    });

    if (!teacherClass) {
      throw new NotFoundError("class not found");
    }

    teacherstudents = await StudentTeacherClass.find({ school: teacherCurrentSchool, class: data.class_id })
      .populate({ path: "student", select: ["_id"] })
      .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

    if (!teacherstudents) {
      throw new NotFoundError("No student found");
    }

    teacherstudents = teacherstudents.map((item) => item.student._id);

    const students = teacherstudents;

    for (const studentId of students) {
      const student = await Student.findOne({ _id: studentId });

      (data.student_id = student._id), (data.school_id = teacherCurrentSchool);

      const lab = await this.createExperiment(data, experiment);
      student.labs.push(lab._id);

      promises.push(student.save());

      promises.push(createAssignedLabNotification(student._id, lab._id, teacher.name || teacher.email));
    }

    return Promise.all(promises);
  }

  async getLabs(conditions: Filter): Promise<ILabExperiment[]> {
    return LabExperiment.find(conditions).populate({ path: "teacher", select: ["name", "_id", "email"] });
  }

  async getByExperimentId(id: string, conditions = {}): Promise<ILabExperiment | null> {
    return LabExperiment.find({ "experiment._id": id, ...conditions }).populate({
      path: "teacher",
      select: ["name", "_id", "email"],
    });
  }

  private async createExperiment(data: CreateLabAssignment, experiment: SystemExperiment): Promise<ILabExperiment> {
    const code = this.generateCode();
    const labData: ILabExperiment = {
      dueDate: data.due_date,
      // experiment: experimentId,
      experiment: {
        name: `${experiment.name} ${code}`,
        icon: experiment.icon,
        subject: experiment.subject,
        _id: experiment._id!,
        code,
        practicalName: experiment.practicalName,
        class: experiment.class,
        demoVideoUrl: experiment.demoVideoUrl,
        label: experiment.name,
      },
      startDate: data.start_date,
      classId: data.class_id,
      instruction: data.instruction,
      student: data.student_id!,
      teacher: data.teacher_id,
      school: data.school_id,
    };

    let lab: any = new LabExperiment(labData);

    let score = new StudentScore({
      classId: data.class_id,
      experimentId: lab._id,
      studentId: data.student_id,
      teacherId: data.teacher_id,
      score: 0,
      school: data.school_id,
    });

    await score.save();

    return lab.save();
  }

  private generateCode(): string {
    return Math.random().toString().slice(-3);
  }
}

export const labAssignmentService = new LabAssignmentService();
