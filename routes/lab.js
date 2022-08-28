const express = require("express");

const router = express.Router();

const { teacherAuth } = require("../middleware/auth");
const labExperimentController = require("../controllers/labExperimentController");

router.post("/:experimentId/assign", teacherAuth, labExperimentController.assignLab);

module.exports = router;