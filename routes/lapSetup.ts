import express from "express";
import { teacherAuth, studentAuth } from "../middleware/auth";

import labSetupController from "../controllers/labSetupController";

const router = express.Router();

/**
 * student [] are added to class as arrays of students ids
 * because a teacher can create multiple class with different student
 *
 */

router.post("/create-lab/:classId", teacherAuth, labSetupController.postCreateLab);

// set x-auth-token in header
router.get("/student/active-experiment/:experimentId", studentAuth, labSetupController.getActiveExperiment);

router.get("/student/active-experiments", studentAuth, labSetupController.getActiveExperiments);
router.post("/student/score", studentAuth, labSetupController.postScore);

router.post("/experiments", labSetupController.getExperiments);

router.post("/student/active-experiment/result", studentAuth, labSetupController.postLabResult);

export default router;
