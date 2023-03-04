const {
  ServerErrorHandler,
} = require("../services/response/serverResponse");
const BadRequestError = require("../services/exceptions/bad-request");
const {
  validateSchoolAdmin,
  validateSchoolUser,
  validateStudent,
} = require("../validations/schoolAdmin.validation");
const schoolAdminService = require("../services/schoolAdmin/schoolAdmin.service");

exports.createSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateSchoolAdmin(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const data = await schoolAdminService.createSchoolAdmin(req.body);

    return res
      .header("x-auth-token", data.token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        admin_name: data.admin.adminName,
        email: data.admin.email,
        schoolEmail: data.admin.schoolEmail,
        schoolName: data.admin.schoolName,
        teachers: data.admin.teachers,
        students: data.admin.students,
        _id: data.admin._id,
      });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { error } = validateSchoolUser(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    await schoolAdminService.createTeacher(req.body, req.school._id);
    res.send({ message: "invitation sent sucessfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { error } = validateStudent(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    await schoolAdminService.createStudent(req.body, req.school._id);
    res.send({ message: "Student added sucessfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.bulkCreateStudents = async (req, res) => {
  try {
    await schoolAdminService.bulkCreateStudents(req, req.school._id);
    res.send({ message: "Students added sucessfully" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getSchoolAdmin = async (req, res) => {
  try {
    const school = await schoolAdminService.getSchoolAdmin(req.school._id);
    res.send({ data: school, message: "school admin successfull fetched" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await schoolAdminService.getStudents(req.school._id);
    res.send({ data: students, message: "students successfull fetched" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
