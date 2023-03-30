import Joi from "joi";

function validateSubscription(subscription) {
  const schema = Joi.object({
    title: Joi.string().required(),
    cost: Joi.number().min(0).required(),
    description: Joi.string(),
  });

  return schema.validate(subscription);
}

function validateUpdateSubscription(subscription) {
  const schema = Joi.object({
    title: Joi.string(),
    cost: Joi.number().min(0),
    description: Joi.string(),
  });

  return schema.validate(subscription);
}

export { validateSubscription, validateUpdateSubscription };
