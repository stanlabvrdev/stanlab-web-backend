const axios = require('axios')
const {
    parsePDF,
    parseDocx,
    splitTo500
} = require('../utils/docParse');
const CustomError = require('../services/exceptions/custom')

//Parse pdf or text and make call to ML model
async function genQuestions(fileType, buffer) {
    try {
        let data
        if (fileType === 'application/pdf') {
            data = await parsePDF(buffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            data = await parseDocx(fileType, buffer)
        } else throw CustomError(400, 'File format not supported')

        const formattedData = splitTo500(data.content[0])

        const callsToModel = formattedData.map((each) => axios.post('https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion', {
            context: each,
            option_set: "Wordnet" //Can be other or Wordnet
        }))
        //Resolve promises and extract questions
        const questions = (await Promise.allSettled(callsToModel)).filter(each => each.status === 'fulfilled').map(each => each.value.data)
        return questions
    } catch (err) {
        // console.log(err.message || null)
        throw err
    }
}


function formatQuestions(arrOfQuestions) {
    //Typescript would be helpful here - to validte the structure of the incoming object
    let finalQuestions = []
    arrOfQuestions.forEach((each) => {
        for (let [question, options] of Object.entries(each)) {
            options = options.map((each) => {
                if (each.startsWith("Ans:")) {
                    return {
                        answer: each.split(": ")[1],
                        isCorrect: true
                    }
                } else {
                    return {
                        answer: each,
                        isCorrect: false
                    }
                }
            })
            finalQuestions.push({
                question,
                options
            })
        }
    })
    return finalQuestions
}

module.exports = {
    genQuestions,
    formatQuestions
}