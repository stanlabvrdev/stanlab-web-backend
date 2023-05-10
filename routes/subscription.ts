import express from "express";

import {
  createPlan,
  getPlans,
  getPlansBySchool,
  syncFreePlan,
  updatePlanById,
  makePayment,
  verifyPayment,
  studentSubscription,
  webhook,
  cancelSubscription,
} from "../controllers/subscription.controller";
import { superAdminAuth, schoolAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", superAdminAuth, createPlan);
router.get("/", superAdminAuth, getPlans);
router.get("/get-plans", schoolAuth, getPlansBySchool);
router.post("/sync-free-plan", schoolAuth, syncFreePlan);
router.put("/:planId", superAdminAuth, updatePlanById);
router.post("/make-payment", schoolAuth, makePayment);
router.post("/verify-payment", schoolAuth, verifyPayment);
router.get("/student-subscription", schoolAuth, studentSubscription);
router.post("/webhook-notification", webhook);
router.put("/cancel-subscription", schoolAuth, cancelSubscription);

export default router;
