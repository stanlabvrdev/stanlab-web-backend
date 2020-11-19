const express = require("express");

const router = express.Router();

/*
ROUTES: -> get total questions
        -> simulate questions base on subject

        question format -> [
            {questionText: "", options:[{label:a, text:"", isCorrect:false, }], subject: "chemistry"    }
        ]
        
*/

router.get("/", (req, res) => {
  res.send([]);
});
