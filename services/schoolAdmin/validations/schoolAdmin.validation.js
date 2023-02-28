const Joi = require("joi");

function validateSchoolAdmin(admin) {
  const schema = Joi.object({
    adminName: Joi.string().min(3).max(255).required(),
    schoolName: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
    schoolEmail: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(admin);
}

function validateSchoolAdminLogin(admin) {
  const schema = Joi.object({
    schoolEmail: Joi.string().email().required(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(admin);
}

function validateUpdateSchoolAdmin(admin) {
  const schema = Joi.object({
    adminName: Joi.string().min(3).max(255),
    schoolName: Joi.string().min(3).max(255),
    email: Joi.string().email(),
    schoolEmail: Joi.string().email(),
  });

  return schema.validate(admin);
}

function validateAddATeacher(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
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
    classId: Joi.string().required()
  });

  return schema.validate(admin);
}

function validateAddStudentToClass(admin) {
  const schema = Joi.object({
    userName: Joi.string().required(),
    classId: Joi.string().required(),
  });

  return schema.validate(admin);
}

module.exports = {
  validateSchoolAdmin,
  validateSchoolAdminLogin,
  validateUpdateSchoolAdmin,
  validateAddATeacher,
  validateCreateClass,
  validateAddTeacherToClass,
  validateAddAStudent,
  validateAddStudentToClass
};
