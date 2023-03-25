import express from "express";
import { teacherAuth } from "../middleware/auth";
import systemExperimentController from "../controllers/systemExperiments";
const router = express.Router();

router.get("/", teacherAuth, systemExperimentController.getSystemExperiments);
router.post("/", teacherAuth, systemExperimentController.createSystemExperiments);
router.get("/:experimentId", teacherAuth, systemExperimentController.getExperiment);
router.delete("/:experimentId", teacherAuth, systemExperimentController.deleteExperiment);
router.put("/:id", teacherAuth, systemExperimentController.updateSystemExperiments);

export default router;
