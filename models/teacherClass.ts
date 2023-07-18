import mongoose from "mongoose";
import Joi from "joi";

interface TeacherClassAttrs {
  title: string;
  subject: string;
  section: string;
  classwork: any;

  students: any[];

  studentsByEmail: any[];
  teacher: any;
  sentQuiz: any[];
  sentLab: any[];
  isPublished: boolean;
  school: string;
  colour: string;
}

interface TeacherClassDoc extends mongoose.Document {
  title: string;
  subject: string;
  section: string;
  classwork: any;

  students: any[];

  studentsByEmail: any[];
  teacher: any;
  sentQuiz: any[];
  sentLab: any[];
  isPublished: boolean;
  school: string;
  colour: string;
}

interface TeacherClassModel extends mongoose.Model<TeacherClassDoc> {
  build(attrs: TeacherClassAttrs): TeacherClassDoc;
}

const teacherClassSchema = new mongoose.Schema<TeacherClassDoc>({
  title: { type: String, minlength: 5, maxlength: 50, required: true },
  subject: { type: String },
  section: { type: String },
  classwork: {
    lab: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabSetup",
      },
    ],
    quiz: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },

  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],

  studentsByEmail: [],
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
  sentQuiz: [{ type: mongoose.Schema.Types.ObjectId, ref: "QuizClasswork" }],
  sentLab: [{ type: mongoose.Schema.Types.ObjectId, ref: "Experiment" }],
  isPublished: { type: Boolean, default: false },
  school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  colour: { type: String },
});

teacherClassSchema.methods.publishClass = function () {
  this.isPublished = true;
  return this;
};

teacherClassSchema.methods.addSentQuiz = function (quizClassworkId) {
  let scw = this.sentQuiz.find((s) => s.toString() === quizClassworkId.toString());

  if (scw) {
    return this;
  }

  this.sentQuiz.push(quizClassworkId);
  return this;
};
teacherClassSchema.methods.addSentLab = function (experimentId) {
  let scl = this.sentLab.find((l) => l.toString() === experimentId.toString());

  if (scl) {
    return this;
  }

  this.sentLab.push(experimentId);
  return this;
};

teacherClassSchema.methods.checkStudentById = function (studentId) {
  if (this.students.find((s) => s.toString() === studentId.toString())) {
    return true;
  }
  return false;
};

teacherClassSchema.methods.addStudentToClass = function (studentId) {
  if (this.students.find((s) => s.toString() === studentId.toString())) {
    return this;
  }

  this.students.push(studentId);

  return this;
};
teacherClassSchema.methods.removeStudentFromClass = function (studentId) {
  const index = this.students.findIndex((s) => s.toString() === studentId.toString());
  if (index < 0) {
    return null;
  }

  this.students.splice(index, 1);

  return this;
};
teacherClassSchema.methods.deleteLabById = function (labId) {
  const index = this.classwork.lab.findIndex((l) => l.toString() === labId.toString());
  if (index < 0) return null;

  this.classwork.lab.splice(index, 1);
  return this;
};

function validateClass(classObj) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(50).required(),
    subject: Joi.string(),
    section: Joi.string(),
    classwork: Joi.object(),
    students: Joi.array(),
    colour: Joi.string(),
  });
  return schema.validate(classObj);
}

function validateUpdateClass(classObj) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(50),
    subject: Joi.string(),
    section: Joi.string(),
    colour: Joi.string(),
  });
  return schema.validate(classObj);
}

const TeacherClass = mongoose.model("TeacherClass", teacherClassSchema);

export { TeacherClass, TeacherClassDoc, validateClass, validateUpdateClass };
