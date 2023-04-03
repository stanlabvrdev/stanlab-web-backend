import { SuperAdmin } from "../../models/superAdmin";
import { SubscriptionPlan } from "../../models/subscriptionPlan";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";

class SubscriptionService {
  async createSubscriptionPlan(body: any, adminId: string) {
    let {
      title,
      cost,
      vat,
      description,
      coupon,
      student_count,
      duration,
      durationType,
      is_active,
    } = body;

    let existingPlan = await SubscriptionPlan.findOne({ title });
    if (existingPlan)
      throw new BadRequestError(
        "subscription plan with this title already exist"
      );

    let admin = await SuperAdmin.findById({ _id: adminId });
    if (!admin) throw new NotFoundError("admin not found");
    console.log(admin._id)

    let plan = new SubscriptionPlan({
      title,
      cost,
      vat: vat * 0.01,
      description,
      coupon,
      student_count,
      duration,
      durationType,
      creator: admin._id,
      is_active,
    });

    return await plan.save();
  }

  async getSubscriptionPlans() {
    let plans = await SubscriptionPlan.find();
    if (!plans) throw new NotFoundError("subscription plan not found");

    return plans;
  }

  async updateSubscriptionPlan(body: any, planId: string) {
    let { title, cost, description } = body;

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    plan.title = title;
    plan.cost = cost;
    plan.description = description;

    return await plan.save();
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
