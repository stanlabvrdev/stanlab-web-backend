import express from "express";
import multer from "multer";

import { QuestionGeneratorController } from "../../controllers/V2/question-gen.controller";

import { teacherAuth } from "../../middleware/auth";

const router = express.Router();
//File filter to check for file type
function pdfFileFilter(req, file, cb) {
  const allowedMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Please upload a PDF or docx file."));
  }
  cb(null, true);
}

const imageFileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new Error("Invalid file type. Only JPEG, JPG, and PNG image files are allowed.");
    return cb(error, false);
  }

  // If file type is allowed, continue with upload
  cb(null, true);
};
const uploadPdf = multer({
  limits: {
    fileSize: 5000000,
  },
  fileFilter: pdfFileFilter,
});

const uploadImage = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter: imageFileFilter,
});
router.use(teacherAuth);

router.post("/file-generate", uploadPdf.single("pdfFile"), QuestionGeneratorController.genFromFile);
router.post("/text-generate", QuestionGeneratorController.genFromText);
router.post("/assign-now", QuestionGeneratorController.assignNow);
router.post("/assign-later", QuestionGeneratorController.assignLater);
router.route("/").post(QuestionGeneratorController.saveQuestions).get(QuestionGeneratorController.getQuestions);
router.route("/:id").delete(QuestionGeneratorController.deleteQuestionGroup).get(QuestionGeneratorController.getAQuestion).put(QuestionGeneratorController.editAQuestionGroup);
router.put("/image", uploadImage.single("image"), QuestionGeneratorController.addImage);
export default router;
