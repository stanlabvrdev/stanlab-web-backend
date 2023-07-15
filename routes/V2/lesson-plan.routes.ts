import express from "express";
import { teacherAuth } from "../../middleware/auth";
import { LessonPlanController } from "../../controllers/V2/lesson-plan.controller";

const lessonPlanController = new LessonPlanController();
const router = express.Router();

router.use(teacherAuth);

router.route("/:Id").get(lessonPlanController.getLessonPlan).put(lessonPlanController.updateLessonPlan).delete(lessonPlanController.deleteLessonPlan);
router.route("/").get(lessonPlanController.getLessonPlans).post(lessonPlanController.createLessonPlan);
router.post("/generate", lessonPlanController.generateLessonPlan);

export default router;
