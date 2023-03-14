const express = require("express");
const router = express.Router();
const {
  createSchoolAdmin,
  createTeacher,
  createStudent,
  bulkCreateStudents,
  getSchoolAdmin,
  getStudents,
  createClass,
  addTeacherToClass,
  addStudentToClass,
  getStudentsByClass,
  getTeacherClasses,
  getClasses,
  updateClass,
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
router.post("/classes", schoolAuth, createClass);
router.put("/classes/:classId/:teacherId", schoolAuth, addTeacherToClass);
router.put("/classes/:classId/student/:studentId", schoolAuth, addStudentToClass);
router.get("/classes/student/:classId", schoolAuth, getStudentsByClass);
router.get("/classes/teacher/:classId", schoolAuth, getTeacherClasses);
router.get("/classes", schoolAuth, getClasses);
router.put("/classes/:classId", schoolAuth, updateClass);

module.exports = router;
