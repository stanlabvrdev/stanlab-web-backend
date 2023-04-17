import {
  ServerErrorHandler,
  ServerResponse,
} from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";
import subscriptionService from "../services/subscription/subscription.service";
import {
  validateSubscription,
  validateUpdateSubscription,
  validatePayment,
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
    ServerResponse(
      req,
      res,
      200,
      plan,
      "subscription plan successfully updated"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const makePayment = async (req, res) => {
  try {
    const { error } = validatePayment(req.body);
    if (error) throw new BadRequestError(error.details[0].message);

    const payment = await subscriptionService.makePayment(
      req.body,
      req.school._id
    );
    ServerResponse(req, res, 200, payment, "payment initialized successfully");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const studentSub = await subscriptionService.verifyPayment(
      req.school._id,
      req.query.reference
    );
    ServerResponse(req, res, 200, studentSub, "payment successfully verified");
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const getStudentsSubscription = async (req, res) => {
  try {
    const studentSubscription =
      await subscriptionService.getStudentsSubscription(req.school._id);
    ServerResponse(
      req,
      res,
      200,
      studentSubscription,
      "student subscription successfully fetched"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
