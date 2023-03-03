const { SchoolAdmin } = require("../../models/schoolAdmin");
const { Teacher } = require("../../models/teacher");
const { Student } = require("../../models/student");
const { SchoolTeacher } = require("../../models/schoolTeacher");
const { SchoolStudent } = require("../../models/schoolStudent");
const { sendEmailToSchoolAdmin } = require("../email");
const NotFoundError = require("../exceptions/not-found");
const { passwordService } = require("../passwordService");
const generateRandomString = require("../../utils/randomStr");
const Logger = require("../../utils/logger");

class SchoolAdminService {
  async createSchoolAdmin(data) {
    try {
      let admin = await SchoolAdmin.findOne({ email: data.admin_email });
      let school = await SchoolAdmin.findOne({
        schoolEmail: data.school_email,
      });

      if (admin)
        return res
          .status(400)
          .send({ message: "admin with this email already exists" });
      if (school)
        return res
          .status(400)
          .send({ message: "School with this email already exists" });

      const hashedPassword = await passwordService.hash(data.password);

      admin = await SchoolAdmin.create({
        ...data,
        password: hashedPassword,
      });

      const token = admin.generateAuthToken();
      sendEmailToSchoolAdmin(admin);
      return { admin, token };
    } catch (error) {
      return error;
    }
  }
}

module.exports = new SchoolAdminService();
