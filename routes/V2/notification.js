const express = require("express");

// const { studentPassport } = require('../services/initPassport')
// const passportAuth = require('../middleware/studentPassportAuth')
const { studentAuth } = require("../../middleware/auth");
const NotificationController = require("../../controllers/notification");

const router = express.Router();

router.patch("/:id/students", studentAuth, NotificationController.readStudentsNotification);
router.get("/students", studentAuth, NotificationController.getStudentNotifications);

module.exports = router;