import express from "express";
import studentsBillingController from "../controllers/studentsBillController";
import { studentAuth } from "../middleware/auth";

const router = express.Router();

router.post("/stripe/basic", studentAuth, studentsBillingController.postCharge);

export default router;
