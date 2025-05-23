import express from "express";

import { QuestionGeneratorController } from "../../controllers/V2/question-gen.controller";
import { AssignmentController } from "../../controllers/V2/assignment-controller";
import { GeneratedQuestionManagementController } from "../../controllers/V2/generatedQuestions-management";
import { uploadFile, createFileFilter, diskStorage, awsStorage } from "../../middleware/fileUpload";

import { teacherAuth } from "../../middleware/auth";

const router = express.Router();
//File filter to check for file type
const pdfFileFilter = createFileFilter(["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const imageFileFilter = createFileFilter(["image/jpeg", "image/png", "image/jpg"]);
const awsUpload = awsStorage();
const diskUpload = diskStorage();

router.use(teacherAuth);

router.post("/file-generate", uploadFile("pdfFile", pdfFileFilter, diskUpload), QuestionGeneratorController.genFromFile);
router.post("/text-generate", QuestionGeneratorController.genFromText);
router.post("/assign-now", AssignmentController.assignNow);
router.post("/assign-later", AssignmentController.assignLater);
router.route("/").post(GeneratedQuestionManagementController.saveQuestions).get(GeneratedQuestionManagementController.getQuestions);
router.route("/:id").delete(GeneratedQuestionManagementController.deleteQuestionGroup).get(GeneratedQuestionManagementController.getAQuestion).put(GeneratedQuestionManagementController.editAQuestionGroup);
router.post("/image", uploadFile("image", imageFileFilter, awsUpload), GeneratedQuestionManagementController.addImage);
export default router;
