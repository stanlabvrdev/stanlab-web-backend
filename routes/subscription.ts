import express from "express";

import {
  createPlan,
  getPlans,
  updatePlanById,
} from "../controllers/subscription.controller";
import { superAdminAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", superAdminAuth, createPlan);
router.get("/", superAdminAuth, getPlans);
router.put("/:planId", superAdminAuth, updatePlanById);

export default router;
