const express = require("express");
const router = express.Router();
const schoolAdminController = require("../controllers/schoolAdminsController");
const { schoolAuth } = require("../middleware/auth");
const { uploadFile } = require("../middleware/fileUpload");

router.post("/", schoolAdminController.createSchoolAdmin);
router.get("/", schoolAuth, schoolAdminController.getSchoolAdmin);

router.post("/teachers", schoolAuth, schoolAdminController.createTeacher);
router.post("/students", schoolAuth, schoolAdminController.createStudent);
router.post("/students/bulk", schoolAuth, uploadFile("student-file"), schoolAdminController.bulkCreateStudnt);
router.get("/teachers", schoolAuth, schoolAdminController.getTeachers);

module.exports = router;