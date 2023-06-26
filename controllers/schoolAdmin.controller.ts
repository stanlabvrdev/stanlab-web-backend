import {
  ServerErrorHandler,
  ServerResponse,
} from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";
import {
  validateRemoveStudent,
  validateRemoveTeacher,
  validateSchoolAdmin,
  validateSchoolUser,
  validateStudent,
  validateUpdateSchoolAdmin,
} from "../validations/schoolAdmin.validation";
import schoolAdminService from "../services/schoolAdmin/schoolAdmin.service";
import { validateClass, validateUpdateClass } from "../models/teacherClass";

export const createSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateSchoolAdmin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const data = await schoolAdminService.createSchoolAdmin(req.body);

    return res
      .header("x-auth-token", data.token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        admin_name: data.admin.adminName,
        admin_title: data.admin.adminTitle,
        email: data.admin.email,
        schoolName: data.admin.schoolName,
        teachers: data.admin.teachers,
        students: data.admin.students,
        _id: data.admin._id,
        country: data.admin.country,
      });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { error } = validateSchoolUser(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.createTeacher(req.body, req.school._id);
    ServerResponse(req, res, 201, null, "invitation sent sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const makeSubAdmin = async (req, res) => {
  try {
    await schoolAdminService.makeSubAdmin(req.school._id, req.params.teacherId);
    ServerResponse(req, res, 200, null, "sub admin assigned sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const createStudent = async (req, res) => {
  try {
    const { error } = validateStudent(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const student = await schoolAdminService.createStudent(
      req.body,
      req.school._id
    );
    ServerResponse(req, res, 201, student, "student added sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const bulkCreateStudents = async (req, res) => {
  try {
    const students = await schoolAdminService.bulkCreateStudents(
      req,
      req.school._id
    );
    ServerResponse(req, res, 201, students, "students added sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const bulkCreateTeachers = async (req, res) => {
  try {
    await schoolAdminService.bulkCreateTeachers(req, req.school._id);
    ServerResponse(req, res, 201, null, "teachers added sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getSchoolAdmin = async (req, res) => {
  try {
    const school = await schoolAdminService.getSchoolAdmin(req.school._id);
    ServerResponse(req, res, 200, school, "school admin successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getStudents = async (req, res) => {
  try {
    const students = await schoolAdminService.getStudents(req.school._id);
    ServerResponse(req, res, 200, students, "students successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await schoolAdminService.getTeachers(req.school._id);
    ServerResponse(req, res, 200, teachers, "teachers successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const createClass = async (req, res) => {
  try {
    const { error } = validateClass(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const teacherClass = await schoolAdminService.createClass(
      req.body,
      req.school._id
    );
    ServerResponse(req, res, 201, teacherClass, "class created sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const addTeacherToClass = async (req, res) => {
  try {
    await schoolAdminService.addTeacherToClass(
      req.school._id,
      req.params.classId,
      req.body
    );
    ServerResponse(req, res, 200, null, "teacher added to class sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const addStudentToClass = async (req, res) => {
  try {
    await schoolAdminService.addStudentToClass(
      req.school._id,
      req.params.classId,
      req.body
    );
    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const downloadStudents = async (req, res) => {
  try {
    const downloadedUrl = await schoolAdminService.downloadStudents(
      req.school._id
    );
    ServerResponse(
      req,
      res,
      201,
      downloadedUrl,
      "successfully downloaded students"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const addStudentsToClassInBulk = async (req, res) => {
  try {
    await schoolAdminService.addStudentsToClassInBulk(
      req,
      req.school._id,
      req.params.classId
    );
    ServerResponse(req, res, 200, null, "students added to class sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getStudentsByClass = async (req, res) => {
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

export const getTeacherClasses = async (req, res) => {
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

export const getClasses = async (req, res) => {
  try {
    const teacherClass = await schoolAdminService.getClasses(req.school._id);
    ServerResponse(req, res, 200, teacherClass, "class successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getClassById = async (req, res) => {
  try {
    const teacherClass = await schoolAdminService.getClassById(
      req.school._id,
      req.params.classId
    );
    ServerResponse(req, res, 200, teacherClass, "class successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const downloadStudentsByClass = async (req, res) => {
  try {
    const downloadedUrl = await schoolAdminService.downloadStudentsByClass(
      req.school._id,
      req.params.classId
    );
    ServerResponse(
      req,
      res,
      201,
      downloadedUrl,
      "successfully downloaded students"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const updateClass = async (req, res) => {
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

export const updateSchoolAdmin = async (req, res) => {
  try {
    const { error } = validateUpdateSchoolAdmin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const school = await schoolAdminService.updateSchoolAdmin(
      req.body,
      req.school._id
    );
    ServerResponse(req, res, 200, school, "school admin updated sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const removeStudent = async (req, res) => {
  try {
    const { error } = validateRemoveStudent(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.removeStudent(req.school._id, req.body);
    ServerResponse(req, res, 200, null, "students removed sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const removeTeacher = async (req, res) => {
  try {
    const { error } = validateRemoveTeacher(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    await schoolAdminService.removeTeacher(req.school._id, req.body);
    ServerResponse(req, res, 200, null, "teachers removed sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
