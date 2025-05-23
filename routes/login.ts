import express from "express";
import loginController from "../controllers/loginController";
const router = express.Router();

// login and signup with googleOAUTH for teacher

router.post("/teachers/auth/google", loginController.teacherGoogleAuth);

router.post("/teachers", loginController.teacherLogin);

router.post(
  "/students/auth/google",

  loginController.studentGoogleAuth
);

router.post("/students", loginController.studentLogin);
router.post("/school-admin", loginController.schoolAdminLogin);

router.post("/lab/students", loginController.studentLabLogin);
router.post("/super-admin", loginController.superAdminLogin);

export default router;
