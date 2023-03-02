const axios = require('axios')
const {
    parsePDF,
    parseDocx,
    splitTo500
} = require('../utils/docParse');
const CustomError = require('../services/exceptions/custom')
const NotFoundError = require('../services/exceptions/not-found')

//Parse pdf or text and make call to ML model
async function genQuestions(fileType, buffer) {
    try {
        let data
        if (fileType === 'application/pdf') {
            data = await parsePDF(buffer);
        } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            data = await parseDocx(fileType, buffer)
        } else throw CustomError(400, 'File format not supported')
        if (data.totalWords > 2000) throw new CustomError(400, 'Word limit exceeded, file should not contain more than 2000 words')
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



async function saveGeneratedQuestions(questions, GeneratedQuestions, QuestionGroup, subject, topic, req) {
    try {
        const questionSavePromises = questions.map((each) => GeneratedQuestions.create(each))
        const savedQuests = (await Promise.allSettled(questionSavePromises)).filter(each => each.status === 'fulfilled').map(each => each.value.id)
        const questGroup = await QuestionGroup.create({
            teacher: req.teacher._id,
            subject,
            topic,
            questions: savedQuests
        })
        return questGroup
    } catch (err) {
        throw err
    }
}

async function assignQuestions(req, Teacher, TeacherClass, QuestionGroup, Student, mcqModel, createTopicalMcqNotification) {
    try {
        const {
            questGroupId,
            classID,
            startDate,
            dueDate
        } = req.body
        const teacher = await Teacher.findOne({
            _id: req.teacher._id
        });
        //  Check class
        let questGroup = await QuestionGroup.findById(questGroupId)
        if (!questGroup) throw new NotFoundError('Questions not found')
        let teacherClass = await TeacherClass.findOne({
            _id: classID,
            teacher: teacher._id
        });
        if (!teacherClass) throw new NotFoundError("Class not found");
        const students = teacherClass.students;
        if (students.length < 1) throw new NotFoundError("No student found");

        //Notifications promise array
        const promises = [];
        for (let studentId of students) {
            const student = await Student.findOne({
                _id: studentId
            });
            let assigment = await mcqModel.create({
                questions: questGroupId,
                classId: classID,
                startDate,
                dueDate,
                student: studentId,
                teacher: teacher._id
            })
            promises.push(createTopicalMcqNotification(student._id, assigment._id));
        }
        await Promise.all(promises);
    } catch (err) {
        throw err
    }
}


module.exports = {
    genQuestions,
    formatQuestions,
    saveGeneratedQuestions,
    assignQuestions
}