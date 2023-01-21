const express = require("express");
const { teacherAuth } = require("../middleware/auth");
const systemExperimentController = require("../controllers/systemExperiments");
const router = express.Router();

router.get("/", teacherAuth, systemExperimentController.getSystemExperiments);
router.post("/", teacherAuth, systemExperimentController.createSystemExperiments);
router.get("/:experimentId", teacherAuth, systemExperimentController.getExperiment);
router.delete("/:experimentId", teacherAuth, systemExperimentController.deleteExperiment);
router.put("/:id", teacherAuth, systemExperimentController.updateSystemExperiments);

module.exports = router;