const express = require("express");
const studentsBillingController = require("../controllers/studentsBillController");
const { studentAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/stripe/basic", studentAuth, studentsBillingController.postCharge);

module.exports = router;