import mongoose from "mongoose";
import Joi from "joi";

import jwt from "jsonwebtoken";

import envConfig from "../config/env";

const env = envConfig.getAll();

interface SchoolAttrs {
  adminName: string;
  adminTitle: string;
  schoolName: string;
  password: string;
  email: string;
  schoolEmail: string;
  teachers: any[];
  students: any[];
  activities: any[];
  country: string;
  role: string;
}

interface SchoolDoc extends mongoose.Document {
  adminName: string;
  adminTitle: string;
  schoolName: string;
  password: string;
  email: string;
  schoolEmail: string;
  teachers: any[];
  students: any[];
  activities: any[];
  country: string;
  role: string;
}

interface SchoolModel extends mongoose.Model<SchoolDoc> {
  build(attrs: SchoolAttrs): SchoolDoc;
}
const schoolAdminSchema = new mongoose.Schema<SchoolDoc>({
  adminName: { type: String, required: true, minLength: 3, maxlength: 255 },
  adminTitle: { type: String, required: true },
  schoolName: { type: String, required: true, minLength: 3, maxlength: 255 },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  schoolEmail: { type: String },
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }],
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  activities: { type: Array },
  country: { type: String, required: true },
  role: { type: String, default: "School" },
});

schoolAdminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, role: this.role }, env.jwtKey);
  return token;
};

schoolAdminSchema.methods.addTeacher = function (teacherId) {
  const teachers = this.teachers;
  const isExist = teachers.find((t) => t.toString() === teacherId.toString());
  if (isExist) return this;

  teachers.push(teacherId);
  return this;
};

schoolAdminSchema.methods.addStudent = function (studentId) {
  const students = this.students;
  const isExist = students.find((s) => s.toString() === studentId.toString());
  if (isExist) return this;

  students.push(studentId);
  return this;
};
const SchoolAdmin = mongoose.model("SchoolAdmin", schoolAdminSchema);

export { SchoolAdmin };
