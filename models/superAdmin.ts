import mongoose from "mongoose";
import Joi from "joi";
import jwt from "jsonwebtoken";
import envConfig from "../config/env";

const env = envConfig.getAll();

interface SuperAdminAttrs {
  name: string;
  userName: string;
  password: string;
  email: string;
  role: string;
}

interface SuperAdminDoc extends mongoose.Document {
  name: string;
  userName: string;
  password: string;
  email: string;
  role: string;
}

interface SuperAdminModel extends mongoose.Model<SuperAdminDoc> {
  build(attrs: SuperAdminAttrs): SuperAdminDoc;
}

const superAdminSchema = new mongoose.Schema<SuperAdminDoc>({
  name: { type: String, required: true, minLength: 3, maxlength: 255 },
  userName: { type: String, required: true, minLength: 3, maxlength: 255 },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "SuperAdmin" },
});

superAdminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, role: this.role }, env.jwtKey);
  return token;
};


const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

export { SuperAdmin };
