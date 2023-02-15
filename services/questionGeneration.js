const axios = require('axios')
const {
    parsePDF,
    parseDocx,
    splitTo500
} = require('../utils/docParse');

//Parse pdf or text and make call to ML model
async function genQuestions(fileType, buffer) {
    try {
        let data, formattedData
        if (fileType === 'application/pdf') {
            data = await parsePDF(buffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            data = await parseDocx(fileType, buffer)
        } else {
            console.log('File Type not supported')
            //Throw an error that file type is not supported
            //should return here
        }
        formattedData = splitTo500(data.content[0])

        const callsToModel = formattedData.map((each) => axios.post('https://questiongen2-tqzv2kz3qq-uc.a.run.app/', {
            context: each,
            option_set: "other"
        }))

        const questions = Promise.all(callsToModel)
        return questions
    } catch (err) {
        console.log(err) //Proper error handling will be carried out
    }
}