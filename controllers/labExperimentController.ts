import { Teacher } from "../models/teacher";
import { Student } from "../models/student";
import { TeacherClass } from "../models/teacherClass";
import { LabExperiment, validateAssignment, validateGetQuery } from "../models/labAssignment";
import SystemExperiment from "../models/systemExperiments";
import { StudentScore } from "../models/studentScore";
import { createAssignedLabNotification } from "../services/student/notification";
import { ServerResponse, ServerErrorHandler } from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";
import NotFoundError from "../services/exceptions/not-found";
import { Profile } from "../models/profile";
import { StudentTeacherClass } from "../models/teacherStudentClass";

async function assignLab(req, res) {
  try {
    let { class_id, instruction, start_date, due_date } = req.body;

    const { error } = validateAssignment(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const experimentId = req.params.experimentId;
    const teacher = await Teacher.findOne({ _id: req.teacher._id });

    const experiment = await SystemExperiment.findOne({ _id: experimentId });

    if (!experiment) return res.status(404).send({ message: "experiment not found" });

    let teacherCurrentSchool;
    let teacherClass;
    let teacherstudents;
    const promises: any[] = [];

    const profile = await Profile.findOne({ teacher: req.teacher._id });

    if (profile) {
      teacherCurrentSchool = profile.selectedSchool;

      teacherClass = await TeacherClass.findOne({
        _id: class_id,
        school: teacherCurrentSchool,
      });

      if (!teacherClass) {
        throw new NotFoundError("class not found");
      }

      teacherstudents = await StudentTeacherClass.find({ school: teacherCurrentSchool, class: class_id })
        .populate({ path: "student", select: ["_id"] })
        .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

      if (!teacherstudents) {
        throw new NotFoundError("No student found");
      }

      teacherstudents = teacherstudents.map((item) => item.student._id);

      const students = teacherstudents;

      for (const studentId of students) {
        const student = await Student.findOne({ _id: studentId });

        let lab = new LabExperiment({
          dueDate: due_date,
          experiment: experimentId,
          startDate: start_date,
          classId: teacherClass._id,
          instruction,
          student: student._id,
          teacher: teacher._id,
          school: teacherCurrentSchool,
        });

        lab = await lab.save();
        let score = new StudentScore({
          classId: teacherClass._id,
          experimentId: lab._id,
          studentId: student._id,
          teacherId: teacher._id,
          score: 0,
          school: teacherCurrentSchool,
        });

        await score.save();

        student.labs.push(lab._id);

        promises.push(student.save());

        promises.push(createAssignedLabNotification(student._id, lab.id, teacher.name || teacher.email));
      }
    }

    if (!profile) {
      teacherClass = await TeacherClass.findOne({
        _id: class_id,
        teacher: req.teacher._id,
      });

      if (!teacherClass) {
        throw new NotFoundError("class not found");
      }

      teacherstudents = teacherClass.students;

      if (teacherstudents.length < 1) {
        throw new NotFoundError("No student found");
      }

      const students = teacherstudents;

      for (const studentId of students) {
        const student = await Student.findOne({ _id: studentId });

        let lab = new LabExperiment({
          dueDate: due_date,
          experiment: experimentId,
          startDate: start_date,
          classId: teacherClass._id,
          instruction,
          student: student._id,
          teacher: teacher._id,
        });

        lab = await lab.save();
        let score = new StudentScore({
          classId: teacherClass._id,
          experimentId: lab._id,
          studentId: student._id,
          teacherId: teacher._id,
          score: 0,
        });

        await score.save();

        student.labs.push(lab._id);

        promises.push(student.save());

        promises.push(createAssignedLabNotification(student._id, lab.id, teacher.name || teacher.email));
      }
    }

    await Promise.all(promises);

    ServerResponse(req, res, 201, null, "experiment successfully assigned");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getStudentLabs(req, res) {
  try {
    const student = await Student.findOne({ _id: req.student._id });

    const labs = student.labs;

    let gottenLabs = await LabExperiment.find({
      _id: { $in: labs },
    }).populate({ path: "experiment", select: ["_id", "class", "subject", "instruction", "name"] });

    res.send({ message: "labs successfully fetched", lab: gottenLabs });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function deleteAssignedLabsByTeacher(req, res) {
  try {
    const teacher = await Teacher.findOne({ email: req.body.email });

    if (!teacher) throw new NotFoundError("teacher not found");

    const result = await LabExperiment.deleteMany({ teacher: teacher._id });
    const result2 = await StudentScore.deleteMany({ teacherId: teacher._id });

    ServerResponse(req, res, 200, { result, result2 }, "successfully deleted!");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getTeacherAssignedLabs(req, res) {
  try {
    const { error } = validateGetQuery(req.query);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const filter: any = {
      teacher: req.teacher._id,
    };

    const is_completed = req.query.is_completed;

    if (is_completed) {
      filter.isCompleted = is_completed == "true" ? true : false;
    }

    let labs = await LabExperiment.find(filter).populate({
      path: "experiment",
      select: ["_id", "class", "subject", "instruction", "name", "icon"],
    });

    ServerResponse(req, res, 200, labs, "labs successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
async function getLabStudents(req, res) {
  try {
    const { experiment_id } = req.query;
    const filter: any = {
      teacher: req.teacher._id,
    };

    if (experiment_id) {
      filter.experiment = experiment_id;
    }

    let students = await LabExperiment.find(filter)
      .populate({
        path: "student",
        select: ["_id", "email", "name"],
      })
      .select("-instruction -classId -teacher -startDate -dueDate");

    ServerResponse(req, res, 200, students, "students successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export default { assignLab, getStudentLabs, getTeacherAssignedLabs, getLabStudents, deleteAssignedLabsByTeacher };
