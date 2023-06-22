import Joi from "joi";

function validateSchoolAdmin(admin) {
  const schema = Joi.object({
    admin_name: Joi.string().min(3).max(255).required(),
    admin_title: Joi.string().required(),
    school_name: Joi.string().min(3).max(255).required(),
    admin_email: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
    country: Joi.string().required(),
  });

  return schema.validate(admin);
}

function validateSchoolUser(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(admin);
}

function validateStudent(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
  });

  return schema.validate(admin);
}

function validateUpdateSchoolAdmin(admin) {
  const schema = Joi.object({
    admin_name: Joi.string().min(3).max(255),
    admin_title: Joi.string(),
    school_name: Joi.string().min(3).max(255),
    admin_email: Joi.string().email(),
    password: Joi.string().min(5).max(255),
    country: Joi.string(),
  });

  return schema.validate(admin);
}

function validateRemoveStudent(admin) {
  const schema = Joi.object({
    studentId: Joi.array(),
  });

  return schema.validate(admin);
}

export {
  validateSchoolAdmin,
  validateSchoolUser,
  validateStudent,
  validateUpdateSchoolAdmin,
  validateRemoveStudent,
};
