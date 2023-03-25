import express from "express";
import multer from "multer";

import {
  genFromFile,
  genFromText,
  saveQuestions,
  getQuestions,
  deleteQuestionGroup,
  getAQuestionGroup,
  editQuestionGroup,
  assignNow,
  assignLater,
} from "../../controllers/V2/question-gen.controller";

import { teacherAuth } from "../../middleware/auth";

const router = express.Router();
//File filter to check for file type
function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    console.log(file);
    return cb(new Error("Please upload a PDF or docx file."));
  }
  cb(null, true);
}
const upload = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter: fileFilter,
});

router.use(teacherAuth);

router.post("/file-generate", upload.single("pdfFile"), genFromFile);
router.post("/text-generate", genFromText);
router.post("/assign-now", assignNow);
router.post("/assign-later", assignLater);
router.route("/").post(saveQuestions).get(getQuestions);
router.route("/:id").delete(deleteQuestionGroup).get(getAQuestionGroup).put(editQuestionGroup);

export default router;
