import {
  ServerErrorHandler,
  ServerResponse,
} from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";
import {
  validateSuperAdmin,
  validateUpdateSuperAdmin,
  validateCoupon,
  validateUpdateCoupon,
} from "../validations/superAdmin.validation";
import superAdminService from "../services/superAdmin/superAdmin.service";

export const createSuperAdmin = async (req, res) => {
  try {
    const { error } = validateSuperAdmin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const data = await superAdminService.createSuperAdmin(req.body);

    return res
      .header("x-auth-token", data.token)
      .header("access-control-expose-headers", "x-auth-token")
      .send({
        name: data.admin.name,
        userName: data.admin.userName,
        email: data.admin.email,
        _id: data.admin._id,
      });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getSuperAdmin = async (req, res) => {
  try {
    const admin = await superAdminService.getSuperAdmin(req.superAdmin._id);
    ServerResponse(req, res, 200, admin, "super admin successfull fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const updateSuperAdmin = async (req, res) => {
  try {
    const { error } = validateUpdateSuperAdmin(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const admin = await superAdminService.updateSuperAdmin(
      req.body,
      req.params.adminId
    );
    ServerResponse(req, res, 200, admin, "super admin successfully updated");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const createCoupon = async (req, res) => {
  try {
    const { error } = validateCoupon(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const coupon = await superAdminService.createCoupon(
      req.body,
      req.superAdmin._id
    );
    ServerResponse(req, res, 201, coupon, "coupon successfully created");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getCoupon = async (req, res) => {
  try {
    const coupon = await superAdminService.getCoupon();
    ServerResponse(req, res, 200, coupon, "coupon successfully fetched");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { error } = validateUpdateCoupon(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const coupon = await superAdminService.updateCoupon(
      req.body,
      req.params.couponId
    );
    ServerResponse(req, res, 200, coupon, "coupon successfully updated");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
