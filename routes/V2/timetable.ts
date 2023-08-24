import express from "express";
import { TimeTableController } from "../../controllers/V2/timetable.controller";
import { ValidationMiddleware } from "../../middleware/validate.lesson-plan";
import { scheduleSchema } from "../../services/timetable/timetable.dto";
import { schoolAuth } from "../../middleware/auth";

const router = express.Router();

router.route("/").post(ValidationMiddleware.validate(scheduleSchema), TimeTableController.create);

export { router as timetableRoute };
