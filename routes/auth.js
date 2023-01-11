const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.post("/students/reset-password", authController.resetStudentPassword);
router.post("/teachers/reset-password", authController.resetTeacherPassword);
router.post("/teachers/reset-password/confirm", authController.confirmTeacherResetPassword);
router.post("/students/reset-password/confirm", authController.confirmStudentResetPassword);

module.exports = router;