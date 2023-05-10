import NotFoundError from "../exceptions/not-found";
import { Profile } from "../../models/profile";
import { StudentTeacherClass } from "../../models/teacherStudentClass";
import { TeacherClass } from "../../models/teacherClass";
import { QuestionGroup } from "../../models/generated-questions";

const populateOptions = {
  path: "questions",
  select: "-__v",
  options: {
    lean: true,
  },
};

class GeneratedQuestionHelperServiceClass {
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

const models = { TeacherClass, Profile, StudentTeacherClass, QuestionGroup };
const GeneratedQuestionHelperService = new GeneratedQuestionHelperServiceClass(models);

export { GeneratedQuestionHelperService };
