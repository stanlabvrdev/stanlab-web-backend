import { Teacher } from "../models/teacher";
import { validateClass, validateUpdateClass } from "../models/teacherClass";
import {
  ServerErrorHandler,
  ServerResponse,
} from "../services/response/serverResponse";
import { doValidate } from "../services/exceptions/validator";
import BadRequestError from "../services/exceptions/bad-request";
import NotFoundError from "../services/exceptions/not-found";
import { SchoolAdmin } from "../models/schoolAdmin";
import {
  validateRemoveStudent,
  validateRemoveTeacher,
  validateSchoolUser,
  validateStudent,
} from "../validations/schoolAdmin.validation";
import schoolAdminService from "../services/schoolAdmin/schoolAdmin.service";

async function create(req, res) {
  doValidate(validateClass(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findOne({ _id: teacher.subAdmin });
    if (!school) {
      throw new BadRequestError("unauthorized school sub admin");
    }

    let teacherClass = await schoolAdminService.createClass(
      req.body,
      teacher.subAdmin
    );

    ServerResponse(req, res, 200, teacherClass, "class created successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getList(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findOne({ _id: teacher.subAdmin });
    if (!school) {
      throw new BadRequestError("unauthorized school sub admin");
    }

    const teacherClass = await schoolAdminService.getClasses(teacher.subAdmin);
    ServerResponse(req, res, 200, teacherClass, "class successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function getById(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findOne({ _id: teacher.subAdmin });
    if (!school) {
      throw new BadRequestError("unauthorized school sub admin");
    }

    const teacherClass = await schoolAdminService.getClassById(
      teacher.subAdmin,
      req.params.id
    );
    ServerResponse(req, res, 200, teacherClass, "class successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function update(req, res) {
  doValidate(validateUpdateClass(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findOne({ _id: teacher.subAdmin });
    if (!school) {
      throw new BadRequestError("unauthorized school sub admin");
    }

    await schoolAdminService.updateClass(
      req.body,
      teacher.subAdmin,
      req.params.id
    );
    ServerResponse(req, res, 200, null, "class updated sucessfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

async function addStudent(req, res) {
  doValidate(validateStudent(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    await schoolAdminService.addStudentToClass(
      teacher.subAdmin,
      req.params.classId,
      req.body
    );

    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function addBulkStudents(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    await schoolAdminService.addStudentsToClassInBulk(
      req,
      teacher.subAdmin,
      req.params.classId
    );

    ServerResponse(req, res, 200, null, "student added to class sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function getStudents(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    console.log("school");

    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    const students = await schoolAdminService.getStudents(teacher.subAdmin);
    ServerResponse(req, res, 200, students, "students successfull fetched");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function addTeacher(req, res) {
  doValidate(validateSchoolUser(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    await schoolAdminService.createTeacher(req.body, teacher.subAdmin);
    ServerResponse(req, res, 201, null, "invitation sent sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function addBulkTeachers(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    await schoolAdminService.bulkCreateTeachers(req, teacher.subAdmin);
    ServerResponse(req, res, 201, null, "teachers added sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function getTeachers(req, res) {
  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    const teachers = await schoolAdminService.getTeachers(teacher.subAdmin);
    ServerResponse(req, res, 200, teachers, "teachers successfull fetched");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function removeStudent(req, res) {
  doValidate(validateRemoveStudent(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }
    await schoolAdminService.removeStudent(teacher.subAdmin, req.body);

    ServerResponse(req, res, 200, null, "students removed sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

async function removeTeacher(req, res) {
  doValidate(validateRemoveTeacher(req.body));

  try {
    let teacher = await Teacher.findById(req.teacher._id);

    let school = await SchoolAdmin.findById(teacher.subAdmin);
    if (!school) {
      throw new NotFoundError("unauthorized school sub admin");
    }

    await schoolAdminService.removeTeacher(teacher.subAdmin, req.body);

    ServerResponse(req, res, 200, null, "teachers removed sucessfully");
  } catch (err) {
    ServerErrorHandler(req, res, err);
  }
}

export default {
  create,
  getList,
  getById,
  update,
  addStudent,
  addBulkStudents,
  getStudents,
  addTeacher,
  addBulkTeachers,
  getTeachers,
  removeStudent,
  removeTeacher,
};
