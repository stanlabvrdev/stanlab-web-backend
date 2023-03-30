import Joi from "joi";

function validateSuperAdmin(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    userName: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(admin);
}

function validateUpdateSuperAdmin(admin) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255),
    userName: Joi.string().min(3).max(255),
    email: Joi.string().email(),
  });

  return schema.validate(admin);
}

export { validateSuperAdmin, validateUpdateSuperAdmin };
