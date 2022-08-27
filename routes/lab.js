const express = require("express");

const router = express.Router();

const { teacherAuth } = require("../middleware/auth");
const teachersController = require("../controllers/teachersController");

router.post("/assign", teacherAuth, teachersController.assignLab);

module.exports = router;