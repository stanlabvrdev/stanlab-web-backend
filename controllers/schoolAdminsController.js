const { SchoolAdmin, validateSchoolAdmin, validateSchoolUser } = require("../models/schoolAdmin");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const { Teacher } = require("../models/teacher");
const { Student } = require("../models/student");
const generateRandomString = require("../utils/randomStr");
const {
    sendLoginDetails,
    sendEmailToSchoolAdmin,
    sendTeacherInviteEmail,
    sendStudentInviteEmail,
} = require("../services/email");

const { ServerErrorHandler } = require("../services/response/serverResponse");

async function createSchoolAdmin(req, res) {
    const { error } = validateSchoolAdmin(req.body);

    if (error) return res.status(400).send({ message: error.details[0].message });
    let { admin_name, school_name, password, admin_email, school_email } = req.body;

    try {
        let admin = await SchoolAdmin.findOne({ email: admin_email });
        let school = await SchoolAdmin.findOne({ schoolEmail: school_email });

        if (admin) return res.status(400).send({ message: "admin with this email already exists" });
        if (school) return res.status(400).send({ message: "School with this email already exists" });

        const salt = await bcrypt.genSalt(10);
        password = await bcrypt.hash(password, salt);

        admin = new SchoolAdmin({
            password,
            email: admin_email,
            schoolEmail: school_email,
            adminName: admin_name,
            schoolName: school_name,
        });

        const token = admin.generateAuthToken();
        await admin.save();
        sendEmailToSchoolAdmin(admin);

        res
            .header("x-auth-token", token)
            .header("access-control-expose-headers", "x-auth-token")
            .send(_.pick(admin, ["adminName", "email", "schoolEmail", "schoolName", "teachers", "students", "_id"]));
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function createTeacher(req, res) {
    const { error } = validateSchoolUser(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { name, email } = req.body;
    let password = generateRandomString(7);
    try {
        let school = await SchoolAdmin.findOne({ _id: req.school._id });

        let teacher = await Teacher.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (teacher && teacher.checkIsSchool(school._id))
            return res.status(400).send({ message: "You have already added this teacher" });
        if (teacher) {
            sendTeacherInviteEmail(teacher);
            teacher.addSchool(school._id);
            school = school.addTeacher(teacher._id);
            await school.save();
            return res.send({ message: "invitation sent sucessfully" });
        }

        teacher = new Teacher({ name, email, password: hashedPassword });
        teacher.addSchool(school._id);

        sendTeacherInviteEmail(teacher, password);
        await teacher.save();
        school = school.addTeacher(teacher._id);
        await school.save();
        res.send({ message: "invitation sent sucessfully" });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function createStudent(req, res) {
    const { error } = validateSchoolUser(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    const { name, email } = req.body;
    let password = generateRandomString(7);
    try {
        let school = await SchoolAdmin.findOne({ _id: req.school._id });
        let student = await Student.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (student)
            return res.status(400).send({
                message: "Student with this email address already registered on this platform",
            });

        student = new Student({ name, email, password: hashedPassword });
        student.school = req.school._id;
        // student[constants.trialPeriod.title] = moment().add(constants.trialPeriod.days, "days");
        school = school.addStudent(student._id);

        sendStudentInviteEmail(student, password);
        await student.save();
        await school.save();
        res.send({ message: "invitation sent sucessfully" });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

async function getTeachers(req, res) {
    try {
        const schoolTeachers = await SchoolAdmin.findOne({
                _id: req.school._id,
            })
            .populate({
                path: "teachers",
                select: "-students -password -role -schools -__v",
            })
            .select("teachers");
        res.send(schoolTeachers);
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}
async function getSchoolAdmin(req, res) {
    try {
        const school = await SchoolAdmin.findOne({
            _id: req.school._id,
        });

        if (!school) return res.status(404).send({ message: "admin not found" });
        res.send({ data: school, message: "school admin successfull fetched" });
    } catch (error) {
        ServerErrorHandler(req, res, error);
    }
}

module.exports = {
    createSchoolAdmin,
    createTeacher,
    createStudent,
    getTeachers,
    getSchoolAdmin,
};