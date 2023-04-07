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

export const createPlan = async (req, res) => {
  try {
    const { error } = validateSubscription(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const plan = await subscriptionService.createPlan(
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

export const getPlans = async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans();
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

export const updatePlanById = async (req, res) => {
  try {
    const { error } = validateUpdateSubscription(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const plan = await subscriptionService.updatePlanById(
      req.body,
      req.params.planId
    );
    ServerResponse(req, res, 200, plan, "subscription plan successfully updated");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
