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

const upload = multer({
    fileFilter: (req, file, cb) => {
        if (!file) {
            return cb(new Error('No file uploaded'));
        }
        const allowedMimeTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(new Error("Please upload a PDF or docx file."));
        }
        cb(null, true);
    },
});

router.use(teacherAuth)

router.post('/filegenerate', upload.single('pdfFile'), genFromFile)
router.post('/textgenerate', genFromText)
router.route('/').post(saveQuestions).get(getQuestions)
router.route('/:id').delete(deleteQuestionGroup).get(getAQuestionGroup)

module.exports = router