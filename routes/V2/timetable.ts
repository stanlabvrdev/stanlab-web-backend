import express from "express";
import { TimeTableController } from "../../controllers/V2/timetable.controller";
import { ValidationMiddleware } from "../../middleware/validate.lesson-plan";
import {
  addTeachersDto,
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
    TimeTableController.saveGroup
  )
  .get(schoolAuth, TimeTableController.getGroups);

router
  .route("/:id")
  .get(schoolAuth, TimeTableController.getGroup)
  .put(
    schoolAuth,
    ValidationMiddleware.validate(modifyTimetableMetadata),
    TimeTableController.modifyGroupMetadata
  )
  .delete(schoolAuth, TimeTableController.deleteGroup);

router
  .route("/share/:id")
  .post(schoolAuth, TimeTableController.generateShareablelink)
  .get(TimeTableController.getSharedTimetable);
export { router as timetableRoute };

router
  .route("/teachers/:id")
  .post(
    schoolAuth,
    ValidationMiddleware.validate(addTeachersDto),
    TimeTableController.addTeachersToTimetable
  );
