import NotFoundError from "../exceptions/not-found";
import { Profile } from "../../models/profile";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import { TeacherClass } from "../../models/teacherClass";
import { QuestionGroup } from "../../models/generated-questions";
import BadRequestError from "../exceptions/bad-request";
import { createTopicalMcqNotification } from "../student/notification";
import { GeneratedQuestionManagementService } from "./generated-question-service";
import { Request } from "express";
import mcqAssignment from "../../models/mcqAssignment";
import { Teacher } from "../../models/teacher";

const populateOptions = {
  path: "questions",
  select: "-__v",
  options: {
    lean: true,
  },
};

interface ExtendedRequest extends Request {
  file: any;
  teacher: any;
}

class AssignmentHelperServiceClass {
  private models;
  constructor(models) {
    this.models = models;
  }

  private async getTeacherStudentsByClassAndSchool(classID: string, school: string): Promise<string[]> {
    const teacherClass = await this.models.TeacherClass.findOne({ _id: classID, school });
    if (!teacherClass) throw new NotFoundError("Class not found");

    const teacherStudents = await this.models.StudentTeacherClass.find({ school, class: teacherClass._id })
      .populate({ path: "student", select: ["_id"] })
      .select(["-class", "-school", "-createdAt", "-_id", "-__v"]);

    if (teacherStudents.length < 1) throw new NotFoundError("No student in this class");

    return teacherStudents.map((item) => item.student._id);
  }

  private async getTeacherClassStudentsByIDAndTeacher(classID: string, teacherID: string) {
    const teacherClass = await this.models.TeacherClass.findOne({ _id: classID, teacher: teacherID });
    if (!teacherClass) throw new NotFoundError("Class not found");
    if (teacherClass.students.length < 1) throw new NotFoundError("No student in this class found");
    return teacherClass.students;
  }

  async getTeacherStudentsAndSchool(classID: string, teacherID: string) {
    let teacherCurrentSchool;
    let teacherStudents;
    // Find teacher's selected school if any
    const profile = await this.models.Profile.findOne({ teacher: teacherID });

    if (profile) {
      teacherCurrentSchool = profile.selectedSchool;
      teacherStudents = await this.getTeacherStudentsByClassAndSchool(classID, teacherCurrentSchool);
    } else {
      teacherStudents = await this.getTeacherClassStudentsByIDAndTeacher(classID, teacherID);
    }

    return { school: teacherCurrentSchool, students: teacherStudents };
  }

  async extractQuestions(questGroupID: string, teacher: string) {
    let questGroup = await this.models.QuestionGroup.findOne({ _id: questGroupID, teacher }).populate(populateOptions);
    if (!questGroup) throw new NotFoundError("Questions not found");

    const foundQuestions = questGroup.questions.map((eachQuestionGroup) => {
      return { question: eachQuestionGroup.question, image: eachQuestionGroup.image, options: eachQuestionGroup.options };
    });
    return { questGroup, foundQuestions };
  }
}

class AssignmentServiceClass {
  private AssignmentHelperService;
  private GeneratedQuestionManagementService;

  constructor(assignmentHelperService, generatedQuestionManagementService) {
    this.AssignmentHelperService = assignmentHelperService;
    this.GeneratedQuestionManagementService = generatedQuestionManagementService;
  }

  private validateAssignmentDetails(type: string, duration: string | number) {
    let assignmentType = type === "Test" ? type : "Practice";
    let testDuration = duration ? +duration : undefined;
    if (assignmentType === "Test" && testDuration !== undefined && !(testDuration > 0)) throw new BadRequestError("Enter a valid test duration");
    return { assignmentType, testDuration };
  }

  private async assignQuestions(req: Request, createTopicalMcqNotification) {
    const extendedReq = req as ExtendedRequest;
    const { questGroupId, classID, startDate, dueDate, type, duration, instruction, comments } = extendedReq.body;

    const { assignmentType, testDuration } = this.validateAssignmentDetails(type, duration);

    const teacher = await Teacher.findOne({ _id: extendedReq.teacher._id });

    const { questGroup, foundQuestions } = await this.AssignmentHelperService.extractQuestions(questGroupId, extendedReq.teacher._id);

    const { school, students } = await this.AssignmentHelperService.getTeacherStudentsAndSchool(classID, extendedReq.teacher._id);

    const studentWork = students.map((studentID: string) => {
      return {
        student: studentID,
        scores: [],
      };
    });

    const newAssignment = await mcqAssignment.create({
      teacher: teacher._id,
      questions: foundQuestions,
      subject: questGroup.subject,
      topic: questGroup.topic,
      classId: classID,
      startDate,
      dueDate,
      duration: testDuration,
      type: assignmentType,
      school: school,
      instruction,
      comments,
      students: studentWork,
    });

    const promises = students.map((studentID: string) => createTopicalMcqNotification(studentID, newAssignment._id));
    await Promise.all(promises);
    newAssignment.students = undefined;
    return newAssignment;
  }

  async assignNow(req: Request) {
    const questGroup = await this.GeneratedQuestionManagementService.saveQuestions(req);
    req.body.questGroupId = questGroup._id;
    const assignment = await this.assignQuestions(req, createTopicalMcqNotification);
    return assignment;
  }

  async assignLater(req: Request) {
    const assignment = await this.assignQuestions(req, createTopicalMcqNotification);
    return assignment;
  }
}

const models = { TeacherClass, Profile, StudentTeacherClass, QuestionGroup };
const AssignmentHelperService = new AssignmentHelperServiceClass(models);
const AssignmentService = new AssignmentServiceClass(AssignmentHelperService, GeneratedQuestionManagementService);

export { AssignmentService };
