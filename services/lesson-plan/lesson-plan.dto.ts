import Joi from "joi";

export const GenerateLessonPlanSchema = Joi.object({
  subject: Joi.string().required(),
  grade: Joi.string().required(),
  topic: Joi.string().required(),
});

export const CreateLessonPlanSchema = Joi.object({
  lessonPlan: Joi.string().required(),
  subject: Joi.string().required(),
  grade: Joi.string().required(),
  topic: Joi.string().required(),
});

export const UpdateLessonPlanSchema = Joi.object({
  lessonPlan: Joi.string().optional(),
  subject: Joi.string().optional(),
  grade: Joi.string().optional(),
  topic: Joi.string().optional(),
});
