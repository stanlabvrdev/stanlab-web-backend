import express from "express";
import { teacherAuth } from "../../middleware/auth";
import { LessonPlanController } from "../../controllers/V2/lesson-plan.controller";
import { ValidationMiddleware } from "../../middleware/validate.lesson-plan";
import { CreateLessonPlanSchema, DeleteLessonPlanSchema, GenerateLessonPlanSchema, UpdateLessonPlanSchema } from "../../services/lesson-plan/lesson-plan.dto";

const lessonPlanController = new LessonPlanController();
const router = express.Router();

router.use(teacherAuth);

router.route("/:Id").get(lessonPlanController.getLessonPlan).put(ValidationMiddleware.validate(UpdateLessonPlanSchema), lessonPlanController.updateLessonPlan);
router
  .route("/")
  .get(lessonPlanController.getLessonPlans)
  .post(ValidationMiddleware.validate(CreateLessonPlanSchema), lessonPlanController.createLessonPlan)
  .delete(ValidationMiddleware.validate(DeleteLessonPlanSchema), lessonPlanController.deleteLessonPlan);
router.post("/generate", ValidationMiddleware.validate(GenerateLessonPlanSchema), lessonPlanController.generateLessonPlan);

export default router;
