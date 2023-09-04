import express from "express";
import { TimeTableController } from "../../controllers/V2/timetable.controller";
import { ValidationMiddleware } from "../../middleware/validate.lesson-plan";
import {
  modifyTimetableMetadata,
  saveTimetableSchema,
  scheduleSchema,
} from "../../services/timetable/timetable.dto";
import { schoolAuth } from "../../middleware/auth";

const router = express.Router();

router
  .route("/generate")
  .post(ValidationMiddleware.validate(scheduleSchema), TimeTableController.create);

router
  .route("/")
  .post(
    schoolAuth,
    ValidationMiddleware.validate(saveTimetableSchema),
    TimeTableController.saveTimeTable
  )
  .get(schoolAuth, TimeTableController.getTimetables);

router
  .route("/:id")
  .get(schoolAuth, TimeTableController.getTimetable)
  .put(
    schoolAuth,
    ValidationMiddleware.validate(modifyTimetableMetadata),
    TimeTableController.modifyTimeTableMetadata
  )
  .delete(schoolAuth, TimeTableController.deleteTimetable);
export { router as timetableRoute };
