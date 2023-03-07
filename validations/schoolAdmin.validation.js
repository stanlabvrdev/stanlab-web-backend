const Joi = require("joi");

function validateSchoolAdmin(admin) {
  const schema = Joi.object({
    admin_name: Joi.string().min(3).max(255).required(),
    school_name: Joi.string().min(3).max(255).required(),
    admin_email: Joi.string().email().required(),
    school_email: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
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

module.exports = {
  validateSchoolAdmin,
  validateSchoolUser,
  validateStudent,
};
