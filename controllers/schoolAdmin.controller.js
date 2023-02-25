const { ServerErrorHandler } = require("../services/response/serverResponse");
const {
  validateSchoolAdmin,
  validateSchoolAdminLogin,
  validateUpdateSchoolAdmin,
  validateAddATeacher,
  validateCreateClass,
  validateAddTeacherToClass,
  validateAddAStudent,
  validateAddStudentToClass,
} = require("../services/schoolAdmin/validations/schoolAdmin.validation");
const SchoolAdminService = require("../services/schoolAdmin/schoolAdmin.service");
const { requestFilter } = require("../utils/requestFilter");

const schoolAdminInstance = new SchoolAdminService();

exports.createSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateSchoolAdmin(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const data = await schoolAdminInstance.createSchoolAdmin(req.body);
    return res.send({ code: 201, message: "Registration Successful", data });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.schoolAdminLogin = async (req, res) => {
  try {
    const { error } = validateSchoolAdminLogin(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const { token } = await schoolAdminInstance.schoolAdminLogin(req.body);

    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({ code: 200, message: "Login Successful" });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getSchoolAdmin = async (req, res) => {
  try {
    const schoolAdmin = await schoolAdminInstance.getSchoolAdmin(
      req.school._id
    );
    return res.send({
      code: 200,
      message: "School admin successfull fetched",
      schoolAdmin,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.updateSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateUpdateSchoolAdmin(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const schoolAdmin = await schoolAdminInstance.updateSchoolAdmin(
      req.school._id,
      req.body
    );
    return res.send({
      code: 200,
      message: "School admin successfull updated",
      schoolAdmin,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addATeacher = async (req, res) => {
  try {
    const { error } = validateAddATeacher(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const teacher = await schoolAdminInstance.addATeacher(
      req.school._id,
      req.body
    );
    return res.send({
      code: 200,
      message: "Invitation sent sucessfully",
      teacher,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addBulkTeachers = async (req, res) => {
  try {
    const csv = req.file.buffer.toString();
    await schoolAdminInstance.addBulkTeachers(csv, req.school._id);
    return res.send({
      code: 201,
      message: "Teachers Added Successfully",
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const data = await schoolAdminInstance.getTeachers(req.school._id);
    return res.send({
      code: 200,
      message: "Teachers successfull fetched",
      data,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.createClass = async (req, res) => {
  try {
    const { error } = validateCreateClass(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const teacherClass = await schoolAdminInstance.createClass(req.body);
    return res.send({
      code: 200,
      message: "Class created Successfully",
      teacherClass,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.assignTeacherToClass = async (req, res) => {
  try {
    const { error } = validateAddTeacherToClass(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    await schoolAdminInstance.assignTeacherToClass(req.body);
    return res.send({
      code: 200,
      message: "Teacher Assigned Successfully",
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getClasses = async (req, res) => {
  try {
    const filter = await requestFilter({ ...req.query });
    const data = await schoolAdminInstance.getClasses(filter);
    return res.send({
      code: 200,
      message: "Class fetched Successfully",
      data,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addAStudent = async (req, res) => {
  try {
    const { error } = validateAddAStudent(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    const student = await schoolAdminInstance.addAStudent(
      req.school._id,
      req.body
    );
    return res.send({
      code: 200,
      message: "Student Added Successfully",
      student,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addBulkStudents = async (req, res) => {
  try {
    const csv = req.file.buffer.toString();
    await schoolAdminInstance.addBulkStudents(csv, req.school._id);
    return res.send({
      code: 201,
      message: "Students Added Successfully",
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addStudentToClass = async (req, res) => {
  try {
    const { error } = validateAddStudentToClass(req.body);
    if (error)
      return res.status(400).send({ message: error.details[0].message });

    await schoolAdminInstance.addStudentToClass(req.body);
    return res.send({
      code: 200,
      message: "Student Added to Class Successfully",
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getStudents = async (req, res) => {
  try {
    const data = await schoolAdminInstance.getStudents(req.school._id);
    return res.send({
      code: 200,
      message: "Students successfull fetched",
      data,
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
