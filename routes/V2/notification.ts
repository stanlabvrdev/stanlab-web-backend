import express from "express";

// import  { studentPassport } from '../services/initPassport
// import  passportAuth from '../middleware/studentPassportAuth
import { studentAuth } from "../../middleware/auth";
import NotificationController from "../../controllers/notification";

const router = express.Router();

router.patch("/:id/students", studentAuth, NotificationController.readStudentsNotification);
router.get("/students", studentAuth, NotificationController.getStudentNotifications);

export default router;
