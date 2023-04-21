import express from "express";

import {
  createPlan,
  getPlans,
  syncFreePlan,
  updatePlanById,
  makePayment,
  verifyPayment,
  studentSubscription,
} from "../controllers/subscription.controller";
import { superAdminAuth, schoolAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", superAdminAuth, createPlan);
router.get("/", getPlans);
router.post("/sync-free-plan", schoolAuth, syncFreePlan);
router.put("/:planId", superAdminAuth, updatePlanById);
router.post("/make-payment", schoolAuth, makePayment);
router.post("/verify-payment", schoolAuth, verifyPayment);
router.get("/student-subscription", schoolAuth, studentSubscription);

export default router;
