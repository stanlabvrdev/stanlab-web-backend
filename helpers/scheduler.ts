import { StudentSubscription } from "../models/student-subscription";
import { SchoolAdmin } from "../models/schoolAdmin";
import subscriptionService from "../services/subscription/subscription.service";
import { Coupon } from "../models/coupon";

const checkSubscription = async () => {
  const school = await SchoolAdmin.find();
  const freePlan = await subscriptionService.getFreePlan();

  await Promise.all(
    school.map(async (element: any) => {
      const subscriptions = await StudentSubscription.find({
        school: element._id,
      });

      subscriptions.map(async (subscribe: any) => {
        if (subscribe && subscribe.endDate < new Date()) {
          if (
            subscribe.subscriptionPlanId.toString() == freePlan._id.toString()
          ) {
            await subscriptionService.deactivate(subscribe.student);
          }

          if (
            subscribe.subscriptionPlanId.toString() !== freePlan._id.toString()
          ) {
            if (subscribe.autoRenew === false) {
              await subscriptionService.deactivate(subscribe.student);
            }

            if (subscribe.autoRenew === true) {
              if (subscribe.extensionDate < new Date()) {
                await subscriptionService.deactivate(subscribe.student);
              }

              if (subscribe.extensionDate > new Date()) {
                await subscriptionService.recurringSubscriptionPayment(
                  element._id,
                  subscribe.student,
                  subscribe.subscriptionPlanId
                );
              }
            }
          }
        }
      });
    })
  );
};

const checkCoupon = async () => {
  let coupons = await Coupon.find();
  await Promise.all(
    coupons.map((coupon: any) => {
      if (coupon.endDate < new Date()) {
        coupon.isActive = false;
        coupon.save();
      }
    })
  );
};

export { checkSubscription, checkCoupon };
