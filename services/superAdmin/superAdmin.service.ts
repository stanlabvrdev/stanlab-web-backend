import { SuperAdmin } from "../../models/superAdmin";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";

class SuperAdminService {
  async createSuperAdmin(body) {
    let { name, userName, password, email } = body;

    let admin = await SuperAdmin.findOne({ email });
    if (admin)
      throw new BadRequestError("admin with this email already exists");

    password = await passwordService.hash(password);

    admin = new SuperAdmin({
      name,
      userName,
      password,
      email,
    });

    const token = admin.generateAuthToken();
    await admin.save();
    return { admin, token };
  }

  async getSuperAdmin(adminId) {
    const admin = await SuperAdmin.findOne({ _id: adminId });
    if (!admin) throw new NotFoundError("admin not found");
    return admin;
  }

  async updateSuperAdmin(body, adminId) {
    let admin = await SuperAdmin.findById({ _id: adminId });
    if (!admin) throw new NotFoundError("admin was not found");

    let { name, userName, email } = body;

    admin.name = name;
    admin.userName = userName;
    admin.email = email;

    await admin.save();
    return admin;
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;
