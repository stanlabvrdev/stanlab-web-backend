Teacher API
role: Teacher
create Teacher

A teacher can have many students
A teacher add student

A teacher accept student request with the studentID in the body of the request and teacherID in the query parameter

when a teacher click on accept request then student isaccepted is set to true
************************
Question API
create Question -> the following fields are required: questionText, options(must be an array), subject

read Question
delete Question
edit question

************************
Student API
role:Student
Create student


A student can only have one teacher
A student send add request

A student send a add request with the teacherID in the body of the request and the studentID as a query params

when a student send a request it is partially added to teacher list of student waiting for teacher to click accept