import { SuperAdmin } from "../../models/superAdmin";
import { SubscriptionPlan } from "../../models/subscriptionPlan";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";

class SubscriptionService {
  async createSubscriptionPlan(body) {
    let { title, cost, description } = body;

    let existingPlan = await SubscriptionPlan.findOne({ title });
    if (existingPlan)
      throw new BadRequestError(
        "subscription plan with this title already exist"
      );

    let plan = new SubscriptionPlan({
      title,
      cost,
      description,
    });

    await plan.save();
    return plan;
  }

  async getSubscriptionPlans() {
    let plans = await SubscriptionPlan.find();
    if (!plans) throw new NotFoundError("subscription plan not found");

    return plans;
  }

  async updateSubscriptionPlan(body, planId) {
    let { title, cost, description } = body;

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    plan.title = title;
    plan.cost = cost;
    plan.description = description;

    await plan.save();
    return plan;
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
