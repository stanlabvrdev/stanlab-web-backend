import axios from "axios";
import { parsePDF, parseDocx, splitTo500 } from "../utils/docParse";
import CustomError from "../services/exceptions/custom";
import NotFoundError from "../services/exceptions/not-found";
import BadRequestError from "../services/exceptions/bad-request";

//Parse pdf or text and make call to ML model
async function genQuestions(fileType, buffer) {
  try {
    let data;
    if (fileType === "application/pdf") {
      data = await parsePDF(buffer);
    } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      data = await parseDocx(fileType, buffer);
    } else throw new CustomError(400, "File format not supported");
    if (data.totalWords > 2000)
      throw new CustomError(400, "Word limit exceeded, file should not contain more than 2000 words");
    const formattedData = splitTo500(data.content[0]);

    const callsToModel = formattedData.map((each) =>
      axios.post("https://questiongen-tqzv2kz3qq-uc.a.run.app/getquestion", {
        context: each,
        option_set: "Wordnet", //Can be other or Wordnet
      })
    );
    //Resolve promises and extract questions
    const questions = (await Promise.allSettled(callsToModel))
      .filter((each: any) => each.status === "fulfilled")
      .map((each: any) => each.value.data);
    return questions;
  } catch (err) {
    throw err;
  }
}

function formatQuestions(arrOfQuestions: any) {
  //Typescript would be helpful here - to validte the structure of the incoming object
  let finalQuestions: any = [];
  arrOfQuestions.forEach((each: any) => {
    const entries: any = Object.entries(each);
    for (let [question, options] of entries) {
      options = options.map((each) => {
        if (each.startsWith("Ans:")) {
          return {
            answer: each.split(": ")[1],
            isCorrect: true,
          };
        } else {
          return {
            answer: each,
            isCorrect: false,
          };
        }
      });
      finalQuestions.push({
        question,
        options,
      });
    }
  });
  return finalQuestions;
}

async function saveGeneratedQuestions(req, GeneratedQuestions, QuestionGroup) {
  try {
    const { questions, subject, topic } = req.body;
    const questionSavePromises = questions.map((each) => GeneratedQuestions.create(each)); //Maps through each question object in the array and saves the questions (returns an array of create promises)
    const savedQuests = await Promise.allSettled(questionSavePromises); //Awaits the array of promises created in the previous step
    const savedQuestionsID = savedQuests
      .filter((each) => each.status === "fulfilled")
      .map((each: any) => each.value.id); //Extracts the id of the saved questions from the fulfilled promises
    const questGroup = await QuestionGroup.create({
      teacher: req.teacher._id,
      subject,
      topic,
      questions: savedQuestionsID,
    });
    return questGroup;
  } catch (err) {
    throw err;
  }
}

//The idea here is that after all the validations are done -each students get a copy of the assignment and the teacher also gets one
//Now, the student's copy are stored on the teacher's copy so the teacher can track each student's progress and submissions
async function assignQuestions(req, models, createTopicalMcqNotification) {
  const { questGroupId, classID, startDate, dueDate, type } = req.body;
  const { Teacher, TeacherClass, QuestionGroup, Student, studentMCQ, teacherMCQ } = models;
  try {
    let assignmentType = type || "Practice";
    if (assignmentType !== "Practice" && assignmentType !== "Test")
      throw new BadRequestError("Assignment has to be of type Practice or Test");
    const teacher = await Teacher.findOne({
      _id: req.teacher._id,
    });
    // Check if question group exists
    let questGroup = await QuestionGroup.findById(questGroupId);
    if (!questGroup) throw new NotFoundError("Questions not found");

    // Check if teacher class exists and belongs to teacher
    let teacherClass = await TeacherClass.findOne({
      _id: classID,
      teacher: teacher._id,
    });
    if (!teacherClass) throw new NotFoundError("Class not found");

    const students = teacherClass.students;
    if (students.length < 1) throw new NotFoundError("No student in this class");

    //Create teacher's copy of assignment
    const teacherAssignment = await teacherMCQ.create({
      teacher: teacher._id,
      questions: questGroupId,
      classId: classID,
      startDate,
      dueDate,
      type: assignmentType,
    });
    //Notifications promise array
    const promises: any = [];
    const studentAssigments: any = [];
    for (let studentId of students) {
      const student = await Student.findOne({
        _id: studentId,
      });
      let studentAssignment: any = await studentMCQ.create({
        questions: questGroupId,
        classId: classID,
        startDate,
        dueDate,
        student: studentId,
        teacher: teacher._id,
        type: assignmentType,
        teacherAssignment: teacherAssignment._id,
      });
      promises.push(createTopicalMcqNotification(student._id, studentAssignment._id));
      studentAssigments.push(studentAssignment._id);
    }
    await Promise.all(promises);
    //Stores the students assignments id on the teacher's copy - will aid teacher tracking of student
    teacherAssignment.studentsWork = studentAssigments;
    await teacherAssignment.save();
    return teacherAssignment;
  } catch (err) {
    throw err;
  }
}

export { genQuestions, formatQuestions, saveGeneratedQuestions, assignQuestions };
