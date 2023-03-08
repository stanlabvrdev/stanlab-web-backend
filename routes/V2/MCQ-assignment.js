const express = require("express");

const {
    studentAuth
} = require("../../middleware/auth");
const {
    getStudentsUnattemptedMCQ,
    getMCQquestions,
    submitAssignment
} = require('../../controllers/V2/MCQ-controller')

const router = express.Router();

router.use(studentAuth)
router.get("/pending", getStudentsUnattemptedMCQ);
router.get("/pending/:id", getMCQquestions);
router.post("/submit", submitAssignment);

module.exports = router;