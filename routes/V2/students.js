const express = require("express");

// const { studentPassport } = require('../services/initPassport')
// const passportAuth = require('../middleware/studentPassportAuth')
const { studentAuth } = require("../../middleware/auth");
const paymentAuth = require("../../middleware/paymentAuth.");
const { isFreelanceStudent } = require("../../middleware/isFreelance");
const studentsController = require("../../controllers/V2/studentController");

const router = express.Router();

router.get("/labs", studentAuth, studentsController.getLabs);
router.get("/classes", studentAuth, studentsController.getClasses);
router.get("/classes/:classId/scores", studentAuth, studentsController.getScores);

module.exports = router;