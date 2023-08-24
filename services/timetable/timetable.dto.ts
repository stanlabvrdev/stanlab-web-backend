import Joi from "joi";

const teacherSchema = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
});

const activitySchema = Joi.object({
  isTimeFixed: Joi.boolean().required(),
  TimeRange: Joi.string().when("isTimeFixed", {
    is: true,
    then: Joi.string().required(),
    otherwise: Joi.optional(),
  }),
  Teacher: teacherSchema.when("isTimeFixed", {
    is: false,
    then: teacherSchema.required(),
    otherwise: teacherSchema.optional(),
  }),
  name: Joi.string().required(),
  color: Joi.string().required(),
});

export const scheduleSchema = Joi.object({
  classes: Joi.array()
    .items(
      Joi.object({
        classid: Joi.string().required(),
        classname: Joi.string().required(),
      })
    )
    .required(),
  days: Joi.array()
    .items(
      Joi.string().valid(
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      )
    )
    .required(),
  timeRanges: Joi.array().items(Joi.string()).required(),
  activities: Joi.array().items(activitySchema).required(), //Activities should have a color
});
