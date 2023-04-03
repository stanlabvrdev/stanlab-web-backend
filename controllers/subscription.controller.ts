import {
  ServerErrorHandler,
  ServerResponse,
} from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";
import subscriptionService from "../services/subscription/subscription.service";
import {
  validateSubscription,
  validateUpdateSubscription,
} from "../validations/subscription.validation";

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { error } = validateSubscription(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const plan = await subscriptionService.createSubscriptionPlan(
      req.body,
      req.superAdmin._id
    );

    ServerResponse(
      req,
      res,
      201,
      plan,
      "subscription plan created successfully"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getSubscriptionPlans();
    ServerResponse(
      req,
      res,
      200,
      plans,
      "subscription plan successfull fetched"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { error } = validateUpdateSubscription(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const plan = await subscriptionService.updateSubscriptionPlan(
      req.body,
      req.params.planId
    );
    ServerResponse(req, res, 200, plan, "subscription plan successfully updated");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
