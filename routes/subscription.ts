import express from "express";

import {
  createPlan,
  getPlans,
  updatePlanById,
  makePayment,
  verifyPayment,
  getStudentsSubscription,
} from "../controllers/subscription.controller";
import { superAdminAuth, schoolAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", superAdminAuth, createPlan);
router.get("/", getPlans);
router.put("/:planId", superAdminAuth, updatePlanById);
router.post("/make-payment", schoolAuth, makePayment);
router.post("/verify-payment", schoolAuth, verifyPayment);
router.get("/get-student-subscription", schoolAuth, getStudentsSubscription);

export default router;
