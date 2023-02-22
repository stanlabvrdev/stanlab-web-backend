const Joi = require("joi");

function validateSchoolAdmin(admin) {
  const schema = Joi.object({
    schoolName: Joi.string().min(3).max(255).required(),
    schoolEmail: Joi.string().email().required(),
    adminName: Joi.string().min(3).max(255).required(),
    adminEmail: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(admin);
}

function validateLoginSchoolAdmin(admin) {
  const schema = Joi.object({
    schoolEmail: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(admin);
}

function validateAddATeacher(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    surname: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(admin);
}

function validateCreateClass(admin) {
  const schema = Joi.object({
    title: Joi.string().min(5).max(50).required(),
    subject: Joi.string(),
    section: Joi.string(),
    classwork: Joi.object(),
    students: Joi.array(),
  });

  return schema.validate(admin);
}

function validateAddTeacherToClass(admin) {
  const schema = Joi.object({
    teacherId: Joi.string().required(),
    classId: Joi.string().required(),
  });

  return schema.validate(admin);
}

function validateAddAStudent(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    surname: Joi.string().min(3).max(255).required(),
  });

  return schema.validate(admin);
}

module.exports = {
  validateSchoolAdmin,
  validateLoginSchoolAdmin,
  validateAddATeacher,
  validateCreateClass,
  validateAddTeacherToClass,
  validateAddAStudent,
};
