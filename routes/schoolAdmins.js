const express = require("express");
const router = express.Router();
const {
  createSchoolAdmin,
  createTeacher,
  createStudent,
  bulkCreateStudents,
  getSchoolAdmin,
  getStudents,
} = require("../controllers/schoolAdmin.controller");
const { schoolAuth } = require("../middleware/auth");
const { uploadFile } = require("../middleware/fileUpload");

router.post("/", createSchoolAdmin);
router.post("/teachers", schoolAuth, createTeacher);
router.post("/students", schoolAuth, createStudent);
router.post(
  "/students/bulk",
  schoolAuth,
  uploadFile("student-file"),
  bulkCreateStudents
);
router.get("/", schoolAuth, getSchoolAdmin);
router.get("/students", schoolAuth, getStudents);

module.exports = router;
