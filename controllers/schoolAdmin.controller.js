const {
  ServerErrorHandler,
  ServerResponse,
} = require("../services/response/serverResponse");
const BadRequestError = require("../services/exceptions/bad-request");
const {
  validateSchoolAdmin,
  validateSchoolUser,
  validateStudent,
} = require("../validations/schoolAdmin.validation");
const schoolAdminService = require("../services/schoolAdmin/schoolAdmin.service");
const {
  validateClass,
  validateUpdateClass,
} = require("../models/teacherClass");

exports.createSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateSchoolAdmin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

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
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.createTeacher(req.body, req.school._id);
    ServerResponse(req, res, 201, null, "invitation sent sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { error } = validateStudent(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.createStudent(req.body, req.school._id);
    ServerResponse(req, res, 201, null, "student added sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.bulkCreateStudents = async (req, res) => {
  try {
    await schoolAdminService.bulkCreateStudents(req, req.school._id);
    ServerResponse(req, res, 201, null, "students added sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getSchoolAdmin = async (req, res) => {
  try {
    const school = await schoolAdminService.getSchoolAdmin(req.school._id);
    ServerResponse(req, res, 200, school, "school admin successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await schoolAdminService.getStudents(req.school._id);
    ServerResponse(req, res, 200, students, "students successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.createClass = async (req, res) => {
  try {
    const { error } = validateClass(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.createClass(req.body, req.school._id);
    ServerResponse(req, res, 201, null, "class created sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addTeacherToClass = async (req, res) => {
  try {
    await schoolAdminService.addTeacherToClass(
      req.school._id,
      req.params.classId,
      req.params.teacherId
    );
    ServerResponse(req, res, 200, null, "teacher added to class sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.addStudentToClass = async (req, res) => {
  try {
    await schoolAdminService.addStudentToClass(
      req.school._id,
      req.params.classId,
      req.params.studentId
    );
    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getStudentsByClass = async (req, res) => {
  try {
    const students = await schoolAdminService.getStudentsByClass(
      req.school._id,
      req.params.classId
    );
    ServerResponse(req, res, 200, students, "student fetched sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getTeacherClasses = async (req, res) => {
  try {
    const teacher = await schoolAdminService.getTeacherClasses(
      req.school._id,
      req.params.classId
    );
    ServerResponse(req, res, 200, teacher, "teacher fetched sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.getClasses = async (req, res) => {
  try {
    const teacherClass = await schoolAdminService.getClasses(req.school._id);
    ServerResponse(req, res, 200, teacherClass, "class successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

exports.updateClass = async (req, res) => {
  try {
    const { error } = validateUpdateClass(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.updateClass(
      req.body,
      req.school._id,
      req.params.classId
    );
    ServerResponse(req, res, 200, null, "class updated sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
