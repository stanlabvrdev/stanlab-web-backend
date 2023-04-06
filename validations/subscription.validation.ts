import Joi from "joi";

function validateSubscription(subscription: any) {
  const schema = Joi.object({
    title: Joi.string().required(),
    cost: Joi.number().min(0).required(),
    vat: Joi.number().min(0).required(),
    description: Joi.string(),
    coupon: Joi.string(),
    student_count: Joi.number(),
    duration: Joi.number().required(),
    durationType: Joi.string().required(),
    is_active: Joi.boolean(),
  });

  return schema.validate(subscription);
}

function validateUpdateSubscription(subscription: any) {
  const schema = Joi.object({
    title: Joi.string(),
    cost: Joi.number().min(0),
    vat: Joi.number().min(0),
    description: Joi.string(),
    coupon: Joi.string(),
    student_count: Joi.number(),
    duration: Joi.number(),
    durationType: Joi.string(),
    is_active: Joi.boolean(),
  });

  return schema.validate(subscription);
}

function validatePayment(payment: any) {
  const schema = Joi.object({
    planId: Joi.string().required(),
    studentId: Joi.array().items(Joi.string().required()),
    autoRenew: Joi.boolean(),
  });

  return schema.validate(payment);
}

export { validateSubscription, validateUpdateSubscription, validatePayment };
