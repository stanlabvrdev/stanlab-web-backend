import express from "express";

import {
  createSuperAdmin,
  getSuperAdmin,
  updateSuperAdmin,
} from "../controllers/superAdmin.controller";
import { superAdminAuth } from "../middleware/auth";

const router = express.Router();

router.post("/", createSuperAdmin);
router.get("/", superAdminAuth, getSuperAdmin);
router.put("/:adminId", superAdminAuth, updateSuperAdmin);

export default router;
