const express = require("express");
const { Question, validateQuestion } = require("../models/question");
const router = express.Router();

/*
ROUTES: -> get total questions
        -> simulate questions base on subject

        question format -> [
            {questionText: "", options:[{label:a, text:"", isCorrect:false, }], subject: "chemistry"    }
        ]
        
*/

/** 
 Route: Post
 condition: Teacher should be log in to access this route
 Task : Authentication and Authorization using JWT
        Password Encryption using Bcryptjs
      
*/
router.get("/", async (req, res) => {
  const questions = await Question.find();
  res.send(questions);
});

// only authenticated teacher can post a question
router.post("/", async (req, res) => {
  const { error } = validateQuestion(req.body);
  const { questionText, options, subject, isCorrect, teacher } = req.body;
  if (error) return res.status(400).send(error.details[0].message);
  let question = await Question.findOne({ questionText });
  if (question) return res.status(400).send("This question already exist");
  question = new Question({
    questionText,
    options,
    subject,
    isCorrect,
    teacher,
  });
  await question.save();
  res.send(question);
});
module.exports = router;
