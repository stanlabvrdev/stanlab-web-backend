import Joi from "joi";

function validateSuperAdmin(admin: any) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255).required(),
    userName: Joi.string().min(3).max(255).required(),
    password: Joi.string().min(5).max(255).required(),
    email: Joi.string().email().required(),
  });

  return schema.validate(admin);
}

function validateUpdateSuperAdmin(admin: any) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(255),
    userName: Joi.string().min(3).max(255),
    email: Joi.string().email(),
  });

  return schema.validate(admin);
}

function validateCoupon(coupon: any) {
  const schema = Joi.object({
    discount: Joi.number().required(),
    endDate: Joi.date().required(),
  });

  return schema.validate(coupon);
}

function validateUpdateCoupon(coupon: any) {
  const schema = Joi.object({
    discount: Joi.number(),
    endDate: Joi.date(),
  });

  return schema.validate(coupon);
}
export {
  validateSuperAdmin,
  validateUpdateSuperAdmin,
  validateCoupon,
  validateUpdateCoupon,
};
