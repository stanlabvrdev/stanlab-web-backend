const mongoose = require("mongoose");
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const config = require("config");

// profile:snapshot of the student
const studentSchema = new mongoose.Schema({
    avatar: { type: Buffer },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherClass",
    }, ],

    labs: [{
        experimentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LabExperiment",
        },
    }, ],

    classworks: {
        quizClasswork: [{
            sentQuizId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "QuizClasswork",
            },
            isCompleted: { type: Boolean },
            totalPoints: { type: Number },
            scores: { type: Number },
            answersSummary: [{
                questionId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Question",
                },
                choosenOption: {},
            }, ],
        }, ],

        labClasswork: [{
            sentLab: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Experiment",
            },
            isCompleted: { type: Boolean },
            totalPoints: { type: Number },
            scores: { type: Number },
            experiments: { type: Array, default: [] },
        }, ],
    },

    email: {
        type: String,
        minlength: 5,
        maxlength: 255,
        required: true,
        unique: true,
    },
    name: { type: String, minlength: 3, maxlength: 255, required: true },
    surname: { type: String, minlength: 3, maxlength: 255, required: true },
    userName: { type: String, minlength: 5, maxlength: 255, required: true },
    password: { type: String, minlength: 5, maxlength: 1024, required: true },
    imageUrl: { type: String },
    plan: {
        charge: { type: Number, default: 0 },
        description: String,
        name: { type: String, default: "basic" },
    },

    role: { type: String, default: "Student" },

    teachers: [{
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
        },
        isAccepted: { type: Boolean },
        status: { type: String },
        invite: { type: String },
    }, ],
    unregisteredTeacher: [{ type: String }],
    questions: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
        default: [],
    },
    signupDate: { type: Date, default: Date.now },
    trialPeriodEnds: { type: Date },
    school: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin" },
});

studentSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({ _id: this._id, role: this.role }, config.get("jwtKey"));
    return token;
};

studentSchema.methods.addQuiz = function(quizId) {
    const newQuiz = {
        sentQuizId: quizId,
        isCompleted: false,
    };

    if (this.classworks.quizClasswork.find((data) => data.sentQuizId.toString() === quizId.toString())) {
        return this;
    }

    this.classworks.quizClasswork.push(newQuiz);
    return this;
};
studentSchema.methods.addLab = function(experimentId) {
    // console.log('addLab', experimentId)
    const newExperiment = {
        sentLab: experimentId,
        isCompleted: false,
    };

    if (this.classworks.labClasswork.find((data) => data.sentLab.toString() === experimentId.toString())) {
        return this;
    }

    this.classworks.labClasswork.push(newExperiment);
    return this;
};

studentSchema.methods.addCompletQuiz = function(sentQuizId, totalPoints, answersSummary, scores) {
    const quizData = this.classworks.quizClasswork.find((data) => {
        // console.log(data, sentQuizId)
        return data._id.toString() === sentQuizId.toString();
    });
    // console.log(quizData)
    if (quizData) {
        quizData.isCompleted = true;
        quizData.totalPoints = totalPoints;
        quizData.scores = scores;
        quizData.answersSummary = answersSummary;
    }
    return quizData._id;
};
studentSchema.methods.getCompletedQuizById = function(quizId) {
    const quizData = this.classworks.quizClasswork.find((data) => {
        // console.log(data, sentQuizId)
        return data._id.toString() === quizId.toString();
    });

    if (quizData) {
        return quizData;
    }
    return null;
};
studentSchema.methods.addCompleteExperiment = function(experimentId, scores, experiment) {
    const labData = this.classworks.labClasswork.find((data) => {
        // console.log(data, sentQuizId)
        return data._id.toString() === experimentId.toString();
    });
    if (labData) {
        labData.isCompleted = true;
        labData.scores = scores;
        labData.experiments.push(experiment);
    }
    return this;
};

studentSchema.methods.addTeacher = function(teacherId, inviteFrom) {
    let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

    if (teacher) {
        teacher.status = "";
        return this;
    }

    if (inviteFrom) teacher = { teacher: teacherId, isAccepted: false, invite: inviteFrom };
    else teacher = { teacher: teacherId, isAccepted: false, invite: "student" };

    this.teachers.push(teacher);
    return this;
};

studentSchema.methods.checkTeacherById = function(teacherId) {
    if (this.teachers.find((s) => s.teacher.toString() === teacherId.toString())) {
        return true;
    }
    return false;
};

studentSchema.methods.acceptTeacher = function(teacherId) {
    let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

    if (teacher) {
        teacher.isAccepted = true;
        return this;
    }
    return this;
};

studentSchema.methods.removeTeacher = function(teacherId) {
    const index = this.teachers.findIndex((data) => data.teacher.toString() === teacherId.toString());
    if (index < 0) return null;

    this.teachers.splice(index, 1);
    return this;
};

studentSchema.methods.markTeacherAsRemoved = function(teacherId) {
    let teacher = this.teachers.find((td) => td.teacher.toString() === teacherId.toString());

    if (teacher) {
        teacher.status = "removed";
        return this;
    }
    return this;
};

studentSchema.methods.addUnregisterTeacher = function(email) {
    const teacher = this.unregisteredTeacher.find((t) => t === email);
    if (teacher) return null;
    this.unregisteredTeacher.push(email);
    return this;
};

function validateStudent(student) {
    const schema = Joi.object({
        name: Joi.string().min(5).max(255).required(),
        email: Joi.string().min(5).max(255).email().required(),
        password: Joi.string().min(5).max(255).required(),
        studentClass: Joi.string(),
        role: Joi.string(),
        teacher: Joi.objectId(),
    });

    return schema.validate(student);
}

function validateIDs(id, testString) {
    return Joi.object({
        [testString]: Joi.objectId(),
    }).validate(id);
}

const Student = mongoose.model("Student", studentSchema);
module.exports = { Student, validateStudent, validateIDs };