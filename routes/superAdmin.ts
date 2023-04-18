import express from "express";

import {
  createSuperAdmin,
  getSuperAdmin,
  updateSuperAdmin,
  createCoupon,
  getCoupon,
  updateCoupon,
} from "../controllers/superAdmin.controller";
import { superAdminAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", createSuperAdmin);
router.get("/", superAdminAuth, getSuperAdmin);
router.put("/:adminId", superAdminAuth, updateSuperAdmin);
router.post("/coupons", superAdminAuth, createCoupon);
router.get("/coupons", superAdminAuth, getCoupon);
router.put("/coupons/:couponId", superAdminAuth, updateCoupon);

export default router;
