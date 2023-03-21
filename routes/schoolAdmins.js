const express = require("express");
const router = express.Router();
const {
  createSchoolAdmin,
  createTeacher,
  createStudent,
  bulkCreateStudents,
  bulkCreateTeachers,
  getSchoolAdmin,
  getStudents,
  getTeachers,
  createClass,
  addTeacherToClass,
  addStudentToClass,
  downloadStudents,
  downloadStudentsByClass,
  addStudentsToClassInBulk,
  getStudentsByClass,
  getTeacherClasses,
  getClasses,
  getClassById,
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
router.post(
  "/teachers/bulk",
  schoolAuth,
  uploadFile("teacher-file"),
  bulkCreateTeachers
);
router.get("/", schoolAuth, getSchoolAdmin);
router.get("/students", schoolAuth, getStudents);
router.get("/teachers", schoolAuth, getTeachers);
router.post("/classes", schoolAuth, createClass);
router.put("/classes/:classId/teacher", schoolAuth, addTeacherToClass);
router.put("/classes/:classId/student", schoolAuth, addStudentToClass);
router.post("/bulk/download", schoolAuth, downloadStudents);
router.post("/bulk/download/:classId", schoolAuth, downloadStudentsByClass);
router.post(
  "/classes/:classId/student/bulk",
  schoolAuth,
  uploadFile("student-file"),
  addStudentsToClassInBulk
);
router.get("/classes/student/:classId", schoolAuth, getStudentsByClass);
router.get("/classes/teacher/:classId", schoolAuth, getTeacherClasses);
router.get("/classes", schoolAuth, getClasses);
router.get("/classes/:classId", schoolAuth, getClassById);
router.put("/classes/:classId", schoolAuth, updateClass);

module.exports = router;
