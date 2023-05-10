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

export const getPlansBySchool = async (req, res) => {
  try {
    const plans = await subscriptionService.getPlansBySchool(req.school._id);
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

export const syncFreePlan = async (req, res) => {
  try {
    const subscribers = await subscriptionService.syncFreePlan(req.school._id);
    ServerResponse(
      req,
      res,
      200,
      subscribers,
      "subscription synced successfull"
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

export const webhook = async (req, res) => {
  try {
    await subscriptionService.webhook(req.body, req.headers["verif-hash"]);

    return res.status(200).end();
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};

export const studentSubscription = async (req, res) => {
  try {
    const studentSubscription = await subscriptionService.studentSubscription(
      req.school._id
    );
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

export const cancelSubscription = async (req, res) => {
  try {
    await subscriptionService.cancel(req.school._id, req.body);
    ServerResponse(
      req,
      res,
      200,
      null,
      "student subscription successfully cancelled"
    );
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
};
