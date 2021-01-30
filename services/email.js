const sgMail = require('@sendgrid/mail')
const config = require('config')

sgMail.setApiKey(config.get('sendGrid_API_KEY'))

const stanLabMail = ' info@stanlab.com'

function renderEmailText(teacher, student, role) {
    const message =
        role === 'teacher' ?
        `${teacher.name} (${teacher.email}) Invited you to join his class` :
        `${student.name} (${student.email}) Invited you to be his Teacher`
    const title = role === 'teacher' ? student.name : teacher.name
    return `
    <!DOCTYPE html>
<html lang="en">

<body>
<div style="background-color: '#f8f8f8';">
<h1 style="font-size: 20px; color: #909090;">Hello, ${title}</h1>
<p style="color: #909090;">
    ${message}
</p>
<a style="
  background-color: '#0078f2';
  color: #fff;
  border: none;
  width: 100%;
  padding: 0.25rem;
  color: #909090;
" href="#" class="btn">
Accept
</a>
</div>
</body>

</html>
    
    `
}

function sendInvitation(teacher, student, role) {
    let msg

    if (role === 'teacher') {
        msg = {
            to: student.email,
            from: stanLabMail,
            subject: 'Teacher Invitation  ',
            html: renderEmailText(teacher, student, 'teacher'),
        }
    } else {
        msg = {
            to: teacher.email,
            from: stanLabMail,
            subject: 'Student Invitation  ',
            html: renderEmailText(teacher, student, 'student'),
        }
    }
    return sgMail
        .send(msg)
        .then(() => console.log('sent mail'))
        .catch((err) => console.log(err.message))
}

module.exports = sendInvitation