import express from "express";

import {
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
  updateSchoolAdmin,
  removeStudent,
} from "../controllers/schoolAdmin.controller";
import { schoolAuth } from "../middleware/auth";
import {
  uploadFile,
  createFileFilter,
  diskStorage,
} from "../middleware/fileUpload";

const fileFilter = createFileFilter();
const diskUpload = diskStorage();

const router = express.Router();
router.post("/", createSchoolAdmin);
router.post("/teachers", schoolAuth, createTeacher);
router.post("/students", schoolAuth, createStudent);
router.post(
  "/students/bulk",
  schoolAuth,
  uploadFile("student-file", fileFilter, diskUpload),
  bulkCreateStudents
);
router.post(
  "/teachers/bulk",
  schoolAuth,
  uploadFile("teacher-file", fileFilter, diskUpload),
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
  uploadFile("student-file", fileFilter, diskUpload),
  addStudentsToClassInBulk
);
router.get("/classes/student/:classId", schoolAuth, getStudentsByClass);
router.get("/classes/teacher/:classId", schoolAuth, getTeacherClasses);
router.get("/classes", schoolAuth, getClasses);
router.get("/classes/:classId", schoolAuth, getClassById);
router.put("/classes/:classId", schoolAuth, updateClass);
router.put("/", schoolAuth, updateSchoolAdmin);
router.delete("/remove-students", schoolAuth, removeStudent);

export default router;
