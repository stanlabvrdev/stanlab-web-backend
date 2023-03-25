import mongoose from "mongoose";
import Joi from "joi";

const superAdminSchema = new mongoose.Schema({
  userName: { type: String, required: true, minLength: 3, maxlength: 255 },
  password: { type: String, required: true, minLength: 255 },
});

function validateSuperAdmin(admin) {
  const schema = Joi.object({
    userName: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(admin);
}

const SchoolAdmin = mongoose.model("SuperAdmin", superAdminSchema);

export { SchoolAdmin, validateSuperAdmin };
