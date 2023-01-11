const sgMail = require("@sendgrid/mail");
const config = require("config");

sgMail.setApiKey(config.get("sendGrid_API_KEY"));

const stanLabMail = "info@stanlab.com";

const mailgunAPIKey = config.get("mailgun_API_KEY");

const mailgun = require("mailgun-js");
// const DOMAIN = "https://www.stanlabvr.com";

const DOMAIN = "stanlabvr.com";
const mg = mailgun({ apiKey: mailgunAPIKey, domain: DOMAIN });

function sendStudentInviteEmail(student, password) {
    const data = {
        from: "StanLab <stanlabvr.com>",
        from: stanLabMail,
        to: student.email,
        subject: "School invitation",
        template: "student-invitation",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: student.email,
            password: password,
            name: student.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            console.log("========================");
            console.log(error);
            console.log("========================");
        }
        console.log(body);
    });
}

function sendTeacherInviteEmail(teacher, password) {
    const data = {
        from: "StanLab <stanlabvr.com>",
        from: stanLabMail,
        to: teacher.email,
        subject: "School invitation",
        template: "teacher-invitation",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: teacher.email,
            password: password,
            name: teacher.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            console.log("========================");
            console.log(error);
            console.log("========================");
        }
        console.log(body);
    });
}

function sendEmailToSchoolAdmin(admin) {
    const data = {
        from: "StanLab <stanlabvr.com>",
        from: stanLabMail,
        to: admin.email,
        subject: "Welcome to StanLab",
        template: "welcome-school-admin",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: admin.email,
            name: admin.name,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            console.log("========================");
            console.log(error);
            console.log("========================");
        }
        console.log(body);
    });
}

function doSendInvitationEmail(student, teacher, password) {
    const data = {
        from: "StanLab <stanlabvr.com>",
        from: stanLabMail,
        to: student.email,
        subject: "Invitation",
        template: "invitation",
        "h:X-Mailgun-Variables": JSON.stringify({
            email: student.email,
            password: password,
        }),
    };
    mg.messages().send(data, function(error, body) {
        if (error) {
            console.log("========================");
            console.log(error);
            console.log("========================");
        }
        console.log(body);
    });
}

function renderEmailText(teacher, student, role) {
    const message =
        role === "teacher" ?
        `${teacher.name} (${teacher.email}) Invited you to join his class` :
        `${student.name} (${student.email}) Invited you to be his Teacher ${
          student.password
            ? `please login with the following credentials Email:${student.email} password:${student.password}`
            : ""
        }`;

  const title = role === "teacher" ? student.name : teacher.name;
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
    
    `;
}

function sendInvitation(teacher, student, role) {
  let msg = {};

  if (role === "teacher") {
    msg = {
      to: student.email,
      from: stanLabMail,
      subject: "Teacher Invitation  ",
      ...msg,
      html: renderEmailText(teacher, student, "teacher"),
    };
  } else {
    msg = {
      to: teacher.email,
      from: stanLabMail,
      subject: "Student Invitation  ",
      ...msg,
      html: renderEmailText(teacher, student, "student"),
    };
  }
  return sgMail
    .send(msg)
    .then(() => console.log("sent mail"))
    .catch((err) => console.log(err.message));
}

function sendLoginDetails(email, name, password, schoolName, isNew = false) {
  msg = {
    to: email,
    from: stanLabMail,
    subject: "School Invitation",
    html: `
        <!DOCTYPE html>
<html lang="en">


<body>
    <div style="background-color: '#f8f8f8';">
        <h1 style="font-size: 20px; color: #909090;">Hello, ${name}</h1>
        <p style="color: #909090;">
            ${schoolName}  school has created a teacher account for you
        </p>
        <p style="color: #909090;">
        ${
          isNew
            ? `here are your login details <br/>
        email:  ${email}
        password: ${password}`
            : ""
        } <br/>

    </p>

    <a href='#'>Login</a>
    </div>
</body>

</html>
        
        `,
  };

  return sgMail
    .send(msg)
    .then(() => console.log("sent mail"))
    .catch((err) => console.log(err.message));
}

async function sendResetPassword(student, token, isStudent = true) {
  const data = {
    from: stanLabMail,
    to: student.email,
    subject: "Reset Password",
    template: "forgetpassword",
    "h:X-Mailgun-Variables": JSON.stringify({
      email: student.email,

      name: student.name || student.email,
      url: `https://app.stanlab.co/${isStudent ? "students" : "teachers"}/reset-password/${token}`,
    }),
  };
  mg.messages().send(data, function (error, body) {
    if (error) {
      console.log("========================");
      console.log(error);
      console.log("========================");
    }
    console.log(body);
  });
}

module.exports = {
  sendInvitation,
  sendLoginDetails,
  doSendInvitationEmail,
  sendEmailToSchoolAdmin,
  sendTeacherInviteEmail,
  sendStudentInviteEmail,
  sendResetPassword,
};