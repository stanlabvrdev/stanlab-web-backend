import express from "express";

const router = express.Router();

import { teacherAuth } from "../../middleware/auth";

import { gradebookController } from "../../controllers/V2/gradeBookController";

router.get("/:classId", [teacherAuth], gradebookController.getList);
router.put("/bulk", [teacherAuth], gradebookController.updateScores);

export default router;
