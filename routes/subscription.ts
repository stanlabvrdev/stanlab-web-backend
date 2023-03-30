import express from "express";

import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from "../controllers/subscription.controller";
import { superAdminAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", superAdminAuth, createSubscriptionPlan);
router.get("/", superAdminAuth, getSubscriptionPlans);
router.put("/:planId", superAdminAuth, updateSubscriptionPlan);

export default router;
