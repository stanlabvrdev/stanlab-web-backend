const genQuestions = require('../../services/questionGeneration')
const axios = require('axios')

async function genFromFile(req, res) {
    try {
        //In the route there should be a multer check for file type and file size limits and if there is a file
        const questions = await genQuestions(req.file.mimetype, req.file.buffer)
        res.status(200).send({
            message: 'Questions Generated Successfully',
            data: questions
        })
    } catch (err) {
        console.log(err) //Send appropriate error message
    }
}

async function genFromText(req, res) {
    try {
        const {
            text
        } = req.body
        const questions = await axios.post('https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion', {
            context: each,
            option_set: "Wordnet" //Can be other or Wordnet
        })
        if (questions) {
            res.status(200).send({
                message: 'questions generated successfully',
                data: questions
            })
        }
    } catch (err) {
        console.log(err)
    }
}
// async function genFromText() {
//Return an array of questions

// }

// async function saveQuestions() {
//Expect and array of questions --  [array of objects]
//     const {
//         data
//     } = req.body

// }


// async function getAl
module.exports = {
    genFromFile,
    // genFromText
}