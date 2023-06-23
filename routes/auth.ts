import express from "express";
import authController from "../controllers/authController";

const router = express.Router();

router.post("/students/reset-password", authController.resetStudentPassword);
router.post("/teachers/reset-password", authController.resetTeacherPassword);
router.post("/admins/reset-password", authController.resetSchoolPassword);
router.post("/teachers/reset-password/confirm", authController.confirmTeacherResetPassword);
router.post("/students/reset-password/confirm", authController.confirmStudentResetPassword);
router.post("/admins/reset-password/confirm", authController.confirmSchoolResetPassword);

export default router;
