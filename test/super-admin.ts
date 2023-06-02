import { SubscriptionPlan } from "../models/subscriptionPlan";
import { SuperAdmin } from "../models/superAdmin";
import { passwordService } from "../services";

export async function createAdmin() {
  const password = await passwordService.hash("12345");

  const admin = new SuperAdmin({
    name: "test super admin",
    userName: "test username",
    email: "test@super.com",
    password,
  });

  return admin.save();
}

export async function createPlan(body: any, adminId: string) {
  const plan = new SubscriptionPlan({
    ...body,
    creator: adminId,
  });

  return plan.save();
}
