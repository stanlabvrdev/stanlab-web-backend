import express from "express";
import { teacherAuth } from "../middleware/auth";
import questionsController from "../controllers/questionsController";
const router = express.Router();

// get all quiz from a class
router.get("/quiz/:classId", teacherAuth, questionsController.getQuiz);

/* only authenticated teacher can create a question
Post: Teacher set Quiz question
add questions to list of questions and add reference to the class
*/

router.post("/quiz/:classId", teacherAuth, questionsController.createQuestion);

// teacher delete quiz
router.delete("/quiz/:quizId", teacherAuth, questionsController.deleteQuestion);
router.post("/some-questions", questionsController.postManyQuestions);
router.get("/:questionId", teacherAuth, questionsController.getQuestion);

export default router;
