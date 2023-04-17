import { SuperAdmin } from "../../models/superAdmin";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";
import { passwordService } from "../passwordService";
import { Coupon } from "../../models/coupon";
import generator from "generate-password";

class SuperAdminService {
  async createSuperAdmin(body: any) {
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

  async getSuperAdmin(adminId: string) {
    const admin = await SuperAdmin.findOne({ _id: adminId });
    if (!admin) throw new NotFoundError("admin not found");
    return admin;
  }

  async updateSuperAdmin(body: any, adminId: string) {
    let admin = await SuperAdmin.findById({ _id: adminId });
    if (!admin) throw new NotFoundError("admin was not found");

    let { name, userName, email } = body;

    admin.name = name;
    admin.userName = userName;
    admin.email = email;

    await admin.save();
    return admin;
  }

  async createCoupon(body: any, adminId: string) {
    let { code, discount, endDate } = body;

    code = generator.generate({
      length: 6,
      numbers: true,
      uppercase: true,
    });

    let coupon = new Coupon({
      code,
      discount: discount * 0.01,
      creator: adminId,
      endDate,
    });

    return await coupon.save();
  }

  async getCoupon() {
    const coupon = await Coupon.find();
    return coupon;
  }

  async updateCoupon(body: any, couponId: string) {
    let coupon = await Coupon.findById({ _id: couponId });
    if (!coupon) throw new NotFoundError("coupon was not found");

    let { discount, endDate } = body;

    coupon.discount = discount * 0.01;
    coupon.endDate = endDate;

    return await coupon.save();
  }
}

export const superAdminService = new SuperAdminService();
export default superAdminService;
