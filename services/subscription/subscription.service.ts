import { SuperAdmin } from "../../models/superAdmin";
import { SubscriptionPlan } from "../../models/subscriptionPlan";
import BadRequestError from "../exceptions/bad-request";
import NotFoundError from "../exceptions/not-found";
import { paymentService } from "../payment/payment.service";
import { StudentSubscription } from "../../models/student-subscription";
import { SchoolStudent } from "../../models/schoolStudent";
import { SchoolAdmin } from "../../models/schoolAdmin";
import { Payment } from "../../models/payment";
import { UserPayment } from "../../models/userPayment";
import { STATUS_TYPES } from "../../constants/statusTypes";
import { addDaysToDate } from "../../helpers/dateHelper";
import { PAYSTACK, FLUTTERWAVE } from "../../constants/locations";
import Flutterwave from "flutterwave-node-v3";
import { Coupon } from "../../models/coupon";
import { Webhook } from "../../models/webhook";
import generator from "generate-password";
import envConfig from "../../config/env";
import { SETTINGS_CONSTANTS } from "../../constants/settings";
const env = envConfig.getAll();

class SubscriptionService {
  async createPlan(body: any, adminId: string) {
    let {
      title,
      cost,
      currency,
      country,
      vat,
      description,
      coupon,
      student_count,
      duration,
      durationType,
    } = body;

    let admin = await SuperAdmin.findById({ _id: adminId });
    if (!admin) throw new NotFoundError("admin not found");

    let plan = new SubscriptionPlan({
      title,
      cost,
      currency,
      country,
      vat: vat * 0.01,
      description,
      coupon,
      student_count,
      duration,
      durationType,
      creator: admin._id,
    });

    return await plan.save();
  }

  async getPlans() {
    let plans = await SubscriptionPlan.find();
    return plans;
  }

  async getPlansBySchool(schoolId: string) {
    let school = await SchoolAdmin.findById({ _id: schoolId });

    let plans = await SubscriptionPlan.find({ country: school.country });
    return plans;
  }

  async getFreePlan() {
    const freeSubscriptionPlanTitle =
      SETTINGS_CONSTANTS.FREE_SUBSCRIPTION_TITLE;
    const plan = await SubscriptionPlan.findOne({
      title: freeSubscriptionPlanTitle,
    });

    if (plan) return plan;

    const freePlanCreated = new SubscriptionPlan({
      title: freeSubscriptionPlanTitle,
      cost: 0,
      duration: 30,
      durationType: "months",
      vat: 0,
    });
    return freePlanCreated.save();
  }

  async syncFreePlan(schoolId: string) {
    const students = await SchoolStudent.find({ school: schoolId });
    const freePlan = await this.getFreePlan();

    const syncedPlan = await Promise.all(
      students.map(async (element: any) => {
        let subscriber = await StudentSubscription.findOne({
          student: element.student,
        });

        if (!subscriber) {
          let subscribe = new StudentSubscription({
            student: element.student,
            school: schoolId,
            subscriptionPlanId: freePlan._id,
            endDate: addDaysToDate(freePlan.duration),
            extensionDate: addDaysToDate(freePlan.duration),
            autoRenew: false,
          });
          return subscribe.save();
        }
        return subscriber;
      })
    );
    return syncedPlan;
  }

  async updatePlanById(body: any, planId: string) {
    let {
      title,
      cost,
      currency,
      country,
      vat,
      description,
      coupon,
      student_count,
      duration,
      durationType,
      is_active,
    } = body;

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    plan.title = title;
    plan.cost = cost;
    plan.currency = currency;
    plan.country = country;
    plan.vat = vat * 0.01;
    plan.description = description;
    plan.coupon = coupon;
    plan.student_count = student_count;
    plan.duration = duration;
    plan.durationType = durationType;
    plan.is_active = is_active;

    return await plan.save();
  }

  async makePayment(body: any, schoolId: string) {
    let { planId, studentId, coupon, autoRenew } = body;

    const plan = await SubscriptionPlan.findOne({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    let school = await SchoolAdmin.findById({ _id: schoolId });

    let subscribers = await StudentSubscription.find({
      student: studentId,
      school: school._id,
    });

    const freePlan = await this.getFreePlan();
    let count: number = 0;
    studentId = [];

    subscribers.map((subscriber: any) => {
      if (
        subscriber.subscriptionPlanId.toString() == freePlan._id.toString() ||
        subscriber.isActive == false
      ) {
        count++;

        studentId.push(subscriber.student);
      }
    });

    if (count < 1) {
      throw new BadRequestError("student has an active subscription");
    }

    let totalCost = plan.cost * count;

    if (coupon) {
      let existingCoupon = await Coupon.findOne({ code: coupon });

      if (existingCoupon && existingCoupon.isActive === true) {
        totalCost = totalCost - totalCost * existingCoupon.discount;
      }
    }

    let response: any;
    let payment: any;
    let extension: number =
      plan.duration + SETTINGS_CONSTANTS.SUBSCRIPTION_EXTENSION;

    if (school.country in PAYSTACK) {
      response = await paymentService.PaystackInitializePayment(
        school.email,
        totalCost * 100,
        plan.currency
      );

      if (!response || response.status !== true) {
        throw new BadRequestError("unable to initialize payment");
      }

      payment = new Payment({
        email: school.email,
        cost: totalCost,
        currency: plan.currency,
        country: plan.country,
        school: school._id,
        student: studentId,
        subscriptionPlanId: plan._id,
        reference: response.data.reference,
        accessCode: response.data.access_code,
        authorizationUrl: response.data.authorization_url,
        status: STATUS_TYPES.PENDING,
        autoRenew,
        type: "Paystack",
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      return response;
    }

    if (school.country in FLUTTERWAVE) {
      let generatedReference = generator.generate({
        length: 15,
        numbers: true,
      });

      response = await paymentService.FlutterwaveInitializePayment(
        generatedReference,
        totalCost,
        plan.currency,
        `${env.redirect_URL}`,
        school.email
      );

      if (!response || response.status !== "success") {
        throw new BadRequestError("unable to initialize payment");
      }

      payment = new Payment({
        email: school.email,
        cost: totalCost,
        currency: plan.currency,
        country: plan.country,
        school: school._id,
        student: studentId,
        subscriptionPlanId: plan._id,
        reference: generatedReference,
        authorizationUrl: response.data.link,
        status: STATUS_TYPES.PENDING,
        autoRenew,
        type: "Flutterwave",
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      return { response, reference: payment.reference };
    }
  }

  async webhook(body: any, hash: string) {
    const secretHash = env.flutterwave_secret_hash;
    const signature = hash;

    if (!signature || signature !== secretHash) {
      throw new BadRequestError("this request isn't from Flutterwave; discard");
    }

    const payload = body;

    let webhookpayload = new Webhook({
      txId: payload.id,
      reference: payload.txRef,
    });
    webhookpayload.save();

    return payload;
  }

  async verifyPayment(schoolId: string, reference: string) {
    let payment = await Payment.findOne({ school: schoolId, reference });

    if (!payment) {
      throw new NotFoundError("reference not found");
    }

    let response: any;
    let userPayment: any;

    if (payment.type === "Paystack") {
      response = await paymentService.PaystackVerifyPayment(reference);

      if (response.data.status.toLowerCase() !== "success") {
        throw new BadRequestError(response.data.gateway_response);
      }
      payment.status = response.data.gateway_response;

      userPayment = await UserPayment.findOne({
        school: schoolId,
        signature: response.data.authorization.signature,
      });

      if (!userPayment) {
        userPayment = new UserPayment({
          authorizationCode: response.data.authorization.authorization_code,
          signature: response.data.authorization.signature,
          email: payment.email,
          school: payment.school,
          type: "Paystack",
        });
        userPayment.save();
      }
    }

    if (payment.type === "Flutterwave") {
      const flw = new Flutterwave(
        env.flutterwave_public_key,
        env.flutterwave_secret_key
      );

      const payload = await Webhook.findOne({ reference, isActive: true });
      if (!payload) {
        throw new BadRequestError("cannot process this transaction");
      }

      response = await flw.Transaction.verify({ id: payload.txId });

      payload.isActive = false;
      await payload.save();

      if (
        response.data.status !== "successful" &&
        response.data.amount !== payment.cost &&
        response.data.currency !== payment.currency
      ) {
        throw new BadRequestError(response.data.status);
      }
      payment.status = response.data.status;

      userPayment = await UserPayment.findOne({
        school: schoolId,
        signature: response.data.card.token,
      });

      if (!userPayment) {
        userPayment = new UserPayment({
          token: response.data.card.token,
          email: payment.email,
          school: payment.school,
        });
        userPayment.save();
      }
    }

    await payment.save();

    const studentSub = await Promise.all(
      payment.student.map(async (element: string) => {
        let subscribe = await StudentSubscription.findOne({ student: element });
        subscribe.subscriptionPlanId = payment.subscriptionPlanId;
        subscribe.endDate = payment.endDate;
        subscribe.extensionDate = payment.extensionDate;
        subscribe.autoRenew = payment.autoRenew;
        subscribe.isActive = true;

        return subscribe.save();
      })
    );

    return studentSub;
  }

  async recurringSubscriptionPayment(
    schoolId: string,
    studentId: string,
    planId: string,
    count: number
  ) {
    const userPayment = await UserPayment.findOne({ school: schoolId });

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    let response: any;
    let totalCost = plan.cost * count;

    if (userPayment.type === "Paystack") {
      response = await paymentService.PaystackRecurringPayment(
        userPayment.authorizationCode,
        userPayment.email,
        totalCost * 100
      );

      if (
        !response ||
        response.status !== true ||
        response.data.gateway_response.toLowerCase() !== "approved"
      ) {
        throw new BadRequestError("unable to initialize payment");
      }
    }

    if (userPayment.type === "Flutterwave") {
      let generatedReference = generator.generate({
        length: 15,
        numbers: true,
      });

      response = await paymentService.FlutterwaveRecurringPayment(
        userPayment.token,
        userPayment.email,
        totalCost,
        generatedReference
      );

      if (
        !response ||
        response.status.toLowerCase() !== "success" ||
        response.data.processor_response.toLowerCase() !== "approved"
      ) {
        throw new BadRequestError("unable to initialize payment");
      }
    }

    let subscriber = await StudentSubscription.find({
      student: studentId,
      school: schoolId,
    });

    let extension: number =
      plan.duration + SETTINGS_CONSTANTS.SUBSCRIPTION_EXTENSION;

    subscriber.subscriptionPlanId = plan._id;
    subscriber.startDate = Date.now();
    subscriber.endDate = addDaysToDate(plan.duration);
    subscriber.extensionDate = addDaysToDate(extension);
    subscriber.autoRenew = true;
    subscriber.isActive = true;

    return subscriber.save();
  }

  async studentSubscription(schoolId: string) {
    let studentSubscription = await StudentSubscription.find({
      school: schoolId,
    });
    return studentSubscription;
  }

  async cancel(schoolId: string, body: any) {
    let { studentId } = body;
    const freePlan = await this.getFreePlan();

    let subscribers = await StudentSubscription.find({
      student: studentId,
      school: schoolId,
    });

    subscribers.map((subscriber: any) => {
      if (
        subscriber.subscriptionPlanId.toString() !== freePlan._id.toString()
      ) {
        subscriber.autoRenew = false;
        subscriber.save();
      }
    });
  }

  async deactivateStudentSubscription(studentId: string) {
    let studentSubscription = await StudentSubscription.findOne({
      student: studentId,
    });
    studentSubscription.isActive = false;
    studentSubscription.save();
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
