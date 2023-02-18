const express = require("express");
const multer = require("multer");
const router = express.Router();
const {
    genFromFile,
    genFromText,
    saveQuestions,
    getQuestions,
    deleteQuestionGroup,
    getAQuestionGroup
} = require('../../controllers/V2/question-gen.controller')

const {
    teacherAuth
} = require("../../middleware/auth");

//File filter to check for file type
function fileFilter(req, file, cb) {
    const allowedMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        console.log(file)
        return cb(new Error("Please upload a PDF or docx file."));
    }
    cb(null, true);
}
const upload = multer({
    limits: {
        fileSize: 5000000,
    },
    fileFilter: fileFilter
});

router.use(teacherAuth)

router.post('/filegenerate', upload.single('pdfFile'), genFromFile)
router.post('/textgenerate', genFromText)
router.route('/').post(saveQuestions).get(getQuestions)
router.route('/:id').delete(deleteQuestionGroup).get(getAQuestionGroup)

module.exports = router