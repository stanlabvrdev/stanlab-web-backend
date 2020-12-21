const sgMail = require("@sendgrid/mail");
const config = require("config");

sgMail.setApiKey(config.get("sendGrid_API_KEY"));

const stanLabMail = " info@stanlab.com";

function sendInvitation(teacher, student) {
    const msg = {
        to: student.email,
        from: stanLabMail,
        subject: "Teacher Invitation  ",
        html: `
        <h1>Hello,</h1>
        <p>${teacher.name} (${teacher.email}) Invited you to join his class</p>
        <button>JOIN</button>
        `,
    };
    return sgMail
        .send(msg)
        .then(() => console.log("sent mail"))
        .catch((err) => console.log(err.message));
}

module.exports = sendInvitation;