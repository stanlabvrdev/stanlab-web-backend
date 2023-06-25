import { Types } from "mongoose";

export const topicalAssignmentPipeline = function (classID: string, teacherID: string): Array<object> {
  return [
    { $match: { _id: Types.ObjectId(classID), teacher: Types.ObjectId(teacherID) } },
    { $lookup: { from: "mcqassignments", localField: "_id", foreignField: "classId", as: "assignments" } },
    { $unwind: "$assignments" },
    { $unwind: "$assignments.students" },
    { $lookup: { from: "students", localField: "assignments.students.student", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
  ];
};

export const processPipelineData = function (pipelineData: Array<{ student: Student; assignments: Assignment }>): ProcessedPipelineData {
  const uniqueStudents = {};
  const uniqueAssignments = {};

  pipelineData.forEach((item) => {
    const studentId = item.student._id.toString();
    const assignmentId = item.assignments._id.toString();
    const assignmentTopic = item.assignments.topic;
    const assignmentSubject = item.assignments.subject;
    const studentName = item.student.name;
    const studentScore = item.assignments.students.scores;

    // Store unique students by ID and get their names
    if (!uniqueStudents[studentId]) {
      uniqueStudents[studentId] = studentName;
    }

    // Store unique assignments by ID and get their topic and subject
    if (!uniqueAssignments[assignmentId]) {
      uniqueAssignments[assignmentId] = { topic: assignmentTopic, subject: assignmentSubject };
    }

    // Store student scores for each assignment
    if (studentScore && studentScore.length > 0) {
      if (!uniqueAssignments[assignmentId].scores) {
        uniqueAssignments[assignmentId].scores = {};
      }
      uniqueAssignments[assignmentId].scores[studentId] = studentScore;
    }
  });
  return { uniqueStudents, uniqueAssignments };
};

export const formatJsonForTabularOutput = function (uniqueValues: ProcessedPipelineData): ProcessedData[] {
  const { uniqueStudents, uniqueAssignments } = uniqueValues;

  return Object.keys(uniqueStudents).map((studentId) => {
    const studentName = uniqueStudents[studentId];
    const assignments = Object.keys(uniqueAssignments).map((assignmentId) => {
      const { subject, topic, scores } = uniqueAssignments[assignmentId];
      const studentScore = scores && scores[studentId] ? scores[studentId] : null;
      return { subject, topic, studentScore };
    });
    return { student: studentName, assignments };
  });
};

interface Student {
  _id: string;
  name: string;
}

interface Assignment {
  _id: string;
  topic: string;
  subject: string;
  students: {
    student: string;
    scores: number[];
  };
}

export interface ProcessedData {
  student: string;
  assignments: {
    topic: string;
    subject: string;
    studentScore: number[] | null;
  }[];
}

type ProcessedPipelineData = {
  uniqueStudents: { [studentId: string]: string };
  uniqueAssignments: { [assignmentId: string]: { topic: string; subject: string; scores?: { [studentName: string]: number[] } } };
};
