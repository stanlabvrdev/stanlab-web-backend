import mongoose from "mongoose";
import Joi from "joi";

import jwt from "jsonwebtoken";

import envConfig from "../config/env";

const env = envConfig.getAll();

interface StudentAttrs {
  avatar: string;
  classes: any[];

  labs: any[];

  classworks: any;

  email: string;
  name: string;
  userName: string;
  authCode: string;
  password: string;
  imageUrl: string;
  plan: number;

  role: string;

  teachers: any[];
  unregisteredTeacher: any[];
  questions: any;
  lastLogin: string;
  signupDate: string;
  trialPeriodEnds: string;
  school: string;
  createdAt: string;
  status: string;
}

interface StudentDoc extends mongoose.Document {
  avatar: string;
  classes: any[];

  labs: any[];

  classworks: any;

  email: string;
  name: string;
  userName: string;
  authCode: string;
  password: string;
  imageUrl: string;
  plan: number;

  role: string;

  teachers: any[];
  unregisteredTeacher: any[];
  questions: any;
  lastLogin: string;
  signupDate: string;
  trialPeriodEnds: string;
  school: string;
  createdAt: string;
  status: string;

  generateAuthToken: () => string;
}

interface StudentModel extends mongoose.Model<StudentDoc> {
  build(attrs: StudentAttrs): StudentDoc;
}

const studentSchema = new mongoose.Schema<StudentDoc>({
  avatar: { type: Buffer },
  classes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeacherClass",
    },
  ],

  labs: [
    {
      experimentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LabExperiment",
      },
    },
  ],

  classworks: {
    quizClasswork: [
      {
        sentQuizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "QuizClasswork",
        },
        isCompleted: { type: Boolean },
        totalPoints: { type: Number },
        scores: { type: Number },
        answersSummary: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Question",
            },
            choosenOption: {},
          },
        ],
      },
    ],

    labClasswork: [
      {
        sentLab: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Experiment",
        },
        isCompleted: { type: Boolean },
        totalPoints: { type: Number },
        scores: { type: Number },
        experiments: { type: Array, default: [] },
      },
    ],
  },

  email: {
    type: String,
    minlength: 5,
    maxlength: 255,
  },
  name: { type: String, minlength: 5, maxlength: 255, required: true },
  userName: { type: String },
  authCode: { type: String },
  password: { type: String, minlength: 5, maxlength: 1024, required: true },
  imageUrl: { type: String },
  plan: {
    charge: { type: Number, default: 0 },
    description: String,
    name: { type: String, default: "basic" },
  },

  role: { type: String, default: "Student" },

  teachers: [
    {
      teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
      },
      isAccepted: { type: Boolean },
      status: { type: String },
      invite: { type: String },
    },
  ],
  unregisteredTeacher: [{ type: String }],
  questions: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    default: [],
  },
  lastLogin: { type: Date },
  signupDate: { type: Date, default: Date.now },
  trialPeriodEnds: { type: Date },
  school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Not in class" },
});

studentSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, role: this.role }, env.jwtKey);
  return token;
};

studentSchema.methods.addQuiz = function (quizId) {
  const newQuiz = {
    sentQuizId: quizId,
    isCompleted: false,
  };

  if (this.classworks.quizClasswork.find((data) => data.sentQuizId.toString() === quizId.toString())) {
    return this;
  }

  this.classworks.quizClasswork.push(newQuiz);
  return this;
};
studentSchema.methods.addLab = function (experimentId) {
  const newExperiment = {
    sentLab: experimentId,
    isCompleted: false,
  };

  if (this.classworks.labClasswork.find((data) => data.sentLab.toString() === experimentId.toString())) {
    return this;
  }

  this.classworks.labClasswork.push(newExperiment);
  return this;
};

studentSchema.methods.addCompletQuiz = function (sentQuizId, totalPoints, answersSummary, scores) {
  const quizData = this.classworks.quizClasswork.find((data) => {
    return data._id.toString() === sentQuizId.toString();
  });

  if (quizData) {
    quizData.isCompleted = true;
    quizData.totalPoints = totalPoints;
    quizData.scores = scores;
    quizData.answersSummary = answersSummary;
  }
  return quizData._id;
};
studentSchema.methods.getCompletedQuizById = function (quizId) {
  const quizData = this.classworks.quizClasswork.find((data) => {
    return data._id.toString() === quizId.toString();
  });

  if (quizData) {
    return quizData;
  }
  return null;
};
studentSchema.methods.addCompleteExperiment = function (experimentId, scores, experiment) {
  const labData = this.classworks.labClasswork.find((data) => {
    return data._id.toString() === experimentId.toString();
  });
  if (labData) {
    labData.isCompleted = true;
    labData.scores = scores;
    labData.experiments.push(experiment);
  }
  return this;
};

studentSchema.methods.addTeacher = function (teacherId, inviteFrom) {
  let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

  if (teacher) {
    teacher.status = "";
    return this;
  }

  if (inviteFrom) teacher = { teacher: teacherId, isAccepted: false, invite: inviteFrom };
  else teacher = { teacher: teacherId, isAccepted: false, invite: "student" };

  this.teachers.push(teacher);
  return this;
};

studentSchema.methods.checkTeacherById = function (teacherId) {
  if (this.teachers.find((s) => s.teacher.toString() === teacherId.toString())) {
    return true;
  }
  return false;
};

studentSchema.methods.acceptTeacher = function (teacherId) {
  let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

  if (teacher) {
    teacher.isAccepted = true;
    return this;
  }
  return this;
};

studentSchema.methods.removeTeacher = function (teacherId) {
  const index = this.teachers.findIndex((data) => data.teacher.toString() === teacherId.toString());
  if (index < 0) return null;

  this.teachers.splice(index, 1);
  return this;
};

studentSchema.methods.markTeacherAsRemoved = function (teacherId) {
  let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

  if (teacher) {
    teacher.status = "removed";
    return this;
  }
  return this;
};

studentSchema.methods.addUnregisterTeacher = function (email) {
  const teacher = this.unregisteredTeacher.find((t) => t === email);
  if (teacher) return null;
  this.unregisteredTeacher.push(email);
  return this;
};

function validateStudent(student) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(255).required(),
    email: Joi.string().min(5).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
    studentClass: Joi.string(),
    role: Joi.string(),
    teacher: Joi.string(),
  });

  return schema.validate(student);
}

function validateIDs(id, testString) {
  return Joi.object({
    [testString]: Joi.string(),
  }).validate(id);
}

const Student = mongoose.model("Student", studentSchema);

export { Student, validateStudent, validateIDs };
