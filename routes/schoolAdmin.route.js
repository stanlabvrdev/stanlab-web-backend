const express = require("express");
const {
  createSchoolAdmin,
  schoolAdminLogin,
  getSchoolAdmin,
  updateSchoolAdmin,
  addATeacher,
  addBulkTeachers,
  getTeachers,
  createClass,
  assignTeacherToClass,
  getClasses,
  addAStudent,
  addBulkStudents,
  addStudentToClass,
  getStudents
} = require("../controllers/schoolAdmin.controller");
const { schoolAuth } = require("../middleware/auth");

const multer = require("multer");
const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error("Please upload valid csv file"));
    }
    cb(null, true);
  },
});

const router = express.Router();

router.post("/", createSchoolAdmin);
router.post("/login", schoolAdminLogin);
router.get("/", [schoolAuth], getSchoolAdmin);
router.patch("/", [schoolAuth], updateSchoolAdmin);
router.post("/addATeacher", [schoolAuth], addATeacher);
router.post(
  "/addBulkTeachers",
  [schoolAuth],
  upload.single("uploadTeachers"),
  addBulkTeachers
);
router.get("/getTeachers", [schoolAuth], getTeachers);
router.post("/createClass", [schoolAuth], createClass);
router.patch("/assignTeacherToClass", [schoolAuth], assignTeacherToClass);
router.get("/getClasses", [schoolAuth], getClasses);
router.post("/addAStudent", [schoolAuth], addAStudent);
router.post(
  "/addBulkStudents",
  [schoolAuth],
  upload.single("uploadStudents"),
  addBulkStudents
);
router.patch("/addStudentToClass", [schoolAuth], addStudentToClass);
router.get("/getStudents", [schoolAuth], getStudents);

module.exports = router;
