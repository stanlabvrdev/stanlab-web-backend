const express = require("express");
const { Question, validateQuestion } = require("../models/question");
const { teacherAuth } = require("../middleware/auth");
const { Teacher } = require("../models/teacher");
const router = express.Router();

router.get("/quiz", teacherAuth, async (req, res) => {
  const teacher = req.teacher._id;
  const questions = await Question.find({ teacher });
  console.log(teacher);
  res.send(questions);
});

/* only authenticated teacher can post a question
Post: Teacher set Quiz question
*/
router.post("/quiz", teacherAuth, async (req, res) => {
  const { error } = validateQuestion(req.body);
  let { questionText, options, subject, isCorrect, teacher } = req.body;

  if (error) return res.status(400).send(error.details[0].message);
  let question = await Question.findOne({ questionText });
  if (question) return res.status(400).send("This question already exist");
  question = new Question({
    questionText,
    options,
    subject,
    isCorrect,
    teacher: req.teacher._id,
  });

  try {
    teacher = await Teacher.findById(req.teacher._id);
    if (!teacher)
      return res.status(400).send({ message: "Teacher does not exist" });
    question = await question.save();
    teacher.questions.push(question._id);
    await teacher.save();

    res.send(question);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ message: "something went wrong" });
  }
});

/* only authenticated teacher can post a question
Post: Teacher set Lab question
*/

router.post("/lab", teacherAuth, async (req, res) => {
  res.send("Lab questions");
});
module.exports = router;
