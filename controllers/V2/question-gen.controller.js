const {
    genQuestions,
    formatQuestions
} = require('../../services/questionGeneration')
const axios = require('axios')

async function genFromFile(req, res) {
    try {
        //In the route there should be a multer check for file type and file size limits and if there is a file
        const questions = await genQuestions(req.file.mimetype, req.file.buffer)
        if (questions && questions.length !== 0) {
            const finalQuestions = await formatQuestions(questions)
            return res.status(200).send({
                message: 'Questions Generated Successfully',
                noOfQuestions: finalQuestions.length,
                data: finalQuestions,
            })
        } else {
            //Question generation did not work
        }
    } catch (err) {
        console.log(err) //Send appropriate error message
    }
}

async function genFromText(req, res) {
    try {
        const questions = (await axios.post('https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion', {
            context: req.body.text,
            option_set: "Wordnet" //Can be other or Wordnet
        })).data
        if (questions && questions.length !== 0) {
            const finalQuestions = await formatQuestions([questions])
            return res.status(200).send({
                message: 'Questions Generated Successfully',
                noOfQuestions: finalQuestions.length,
                data: finalQuestions,
            })
        }
    } catch (err) {
        console.log(err)
    }
}


async function saveQuestions() {
    // Expect and array of questions --  [array of objects]
    const {
        data
    } = req.body

}


// async function getAl
module.exports = {
    genFromFile,
    genFromText
}