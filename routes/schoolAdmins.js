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
const schoolAdminController = require("../controllers/schoolAdminsController");
const { schoolAuth } = require("../middleware/auth");
const { uploadFile } = require("../middleware/fileUpload");

router.post("/", createSchoolAdmin);
router.post("/teachers", schoolAuth, createTeacher);
router.post("/students", schoolAuth, createStudent);
router.post("/students/bulk", schoolAuth, uploadFile("student-file"), bulkCreateStudents);
router.get("/", schoolAuth, getSchoolAdmin);
router.get("/students", schoolAuth, getStudents);
//router.post("/", schoolAdminController.createSchoolAdmin);
//router.get("/", schoolAuth, schoolAdminController.getSchoolAdmin);
//router.post("/teachers", schoolAuth, schoolAdminController.createTeacher);
//router.post("/students", schoolAuth, schoolAdminController.createStudent);
//router.get("/teachers", schoolAuth, schoolAdminController.getTeachers);

module.exports = router;
