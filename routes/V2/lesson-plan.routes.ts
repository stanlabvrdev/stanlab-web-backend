import express from "express";
import { teacherAuth } from "../../middleware/auth";
import { LessonPlanController } from "../../controllers/V2/lesson-plan.controller";
import { ValidationMiddleware } from "../../middleware/validate.lesson-plan";
import { CreateLessonPlanDto, GenerateLessonPlanDto, UpdateLessonPlanDto } from "../../services/lesson-plan/lesson-plan.dto";

const lessonPlanController = new LessonPlanController();
const router = express.Router();

router.use(teacherAuth);

router.route("/:Id").get(lessonPlanController.getLessonPlan).put(ValidationMiddleware.validate(UpdateLessonPlanDto), lessonPlanController.updateLessonPlan).delete(lessonPlanController.deleteLessonPlan);
router.route("/").get(lessonPlanController.getLessonPlans).post(ValidationMiddleware.validate(CreateLessonPlanDto), lessonPlanController.createLessonPlan);
router.post("/generate", ValidationMiddleware.validate(GenerateLessonPlanDto), lessonPlanController.generateLessonPlan);

export default router;
