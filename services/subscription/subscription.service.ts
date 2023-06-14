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
import { addDaysToDate } from "../../helpers/dateHelper";
import { PAYSTACK, FLUTTERWAVE } from "../../constants/locations";
import Flutterwave from "flutterwave-node-v3";
import { Coupon } from "../../models/coupon";
import { Webhook } from "../../models/webhook";
import generator from "generate-password";
import envConfig from "../../config/env";
import { SETTINGS_CONSTANTS } from "../../constants/settings";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../../enums/transaction.enum";
import { Transaction } from "../../models/transaction";
import { PAYMENT_TYPES } from "../../enums/payment-types";
import { STRIPE } from "../../constants/locations";
const env = envConfig.getAll();
const stripe = require("stripe")(env.stripe_Secret_Key);

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

    if (plans.length === 0) {
      plans = await SubscriptionPlan.find({
        country: "United States of America (the)",
      });
      return plans;
    }

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

    if (plan.vat) {
      totalCost = totalCost + totalCost * plan.vat;
    }

    let response: any;
    let payment: any;
    let extension: number =
      plan.duration + SETTINGS_CONSTANTS.SUBSCRIPTION_EXTENSION;

    if (school.country in PAYSTACK) {
      response = await paymentService.PaystackInitializePayment(
        school.email,
        totalCost * 100,
        plan.currency,
        `${env.redirect_URL}`
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
        status: TRANSACTION_STATUS.PENDING,
        autoRenew,
        type: PAYMENT_TYPES.PAYSTACK,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction: any = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: payment.reference,
        cost: totalCost,
        currency: plan.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.PENDING,
        email: school.email,
        txnFrom: school._id,
        subscriptionPlanId: plan._id,
      });

      transaction.save();

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
        status: TRANSACTION_STATUS.PENDING,
        autoRenew,
        type: PAYMENT_TYPES.FLUTTERWAVE,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction: any = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: payment.reference,
        cost: totalCost,
        currency: plan.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.PENDING,
        email: school.email,
        txnFrom: school._id,
        subscriptionPlanId: plan._id,
      });

      transaction.save();

      return { response, reference: payment.reference };
    }

    if (plan.country in STRIPE) {
      response = await paymentService.StripeInitializePayment(
        school.email,
        totalCost * 100,
        plan.currency,
        plan.title
      );

      if (!response || response.status !== "open") {
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
        reference: response.id,
        status: TRANSACTION_STATUS.PENDING,
        autoRenew,
        type: PAYMENT_TYPES.STRIPE,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction: any = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: payment.reference,
        cost: totalCost,
        currency: plan.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.PENDING,
        email: school.email,
        txnFrom: school._id,
        subscriptionPlanId: plan._id,
      });

      transaction.save();

      return {
        data: {
          status: response.status,
          data: { url: response.url, reference: response.id },
        },
      };
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

    let transaction = await Transaction.findOne({
      txnFrom: schoolId,
      paymentRef: reference,
    });

    if (!transaction) {
      throw new NotFoundError("transaction not found");
    }

    let response: any;
    let userPayment: any;

    if (payment.type === PAYMENT_TYPES.PAYSTACK) {
      response = await paymentService.PaystackVerifyPayment(reference);

      if (response.data.status.toLowerCase() !== "success") {
        throw new BadRequestError(response.data.gateway_response);
      }

      payment.status = response.data.gateway_response;

      transaction.status = TRANSACTION_STATUS.COMPLETED;
      transaction.channel = response.data.channel;
      transaction.transactionDate = response.data.transaction_date;

      userPayment = await UserPayment.findOne({
        school: schoolId,
        signature: response.data.authorization.signature,
      });

      if (!userPayment) {
        userPayment = new UserPayment({
          authorizationCode: response.data.authorization.authorization_code,
          signature: response.data.authorization.signature,
          email: payment.email,
          currency: payment.currency,
          school: payment.school,
          type: PAYMENT_TYPES.PAYSTACK,
        });
        userPayment.save();
      }
    }

    if (payment.type === PAYMENT_TYPES.FLUTTERWAVE) {
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

      transaction.status = TRANSACTION_STATUS.COMPLETED;
      transaction.channel = response.data.payment_type;
      transaction.transactionDate = response.data.created_at;

      userPayment = await UserPayment.findOne({
        school: schoolId,
        token: response.data.card.token,
      });

      if (!userPayment) {
        userPayment = new UserPayment({
          token: response.data.card.token,
          email: payment.email,
          currency: payment.currency,
          school: payment.school,
          type: PAYMENT_TYPES.FLUTTERWAVE,
        });
        userPayment.save();
      }
    }

    if (payment.type === PAYMENT_TYPES.STRIPE) {
      response = await paymentService.StripeVerifyPayment(reference);

      if (
        response.payment_status !== "paid" &&
        response.status !== "complete"
      ) {
        throw new BadRequestError("payment is incomplete");
      }

      const paymentIntentId = response.payment_intent;

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        throw new BadRequestError(paymentIntent.status);
      }

      payment.status = paymentIntent.status;

      transaction.status = TRANSACTION_STATUS.COMPLETED;
      transaction.channel = response.payment_method_types[0];
      transaction.transactionDate = new Date(paymentIntent.created * 1000);

      userPayment = await UserPayment.findOne({
        school: schoolId,
        customerId: paymentIntent.customer,
        paymentId: paymentIntent.payment_method,
      });

      if (!userPayment) {
        userPayment = new UserPayment({
          customerId: paymentIntent.customer,
          paymentId: paymentIntent.payment_method,
          email: payment.email,
          currency: payment.currency,
          school: payment.school,
          type: PAYMENT_TYPES.STRIPE,
        });
        userPayment.save();
      }
    }

    await payment.save();
    await transaction.save();

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
    planId: string
  ) {
    const userPayment = await UserPayment.findOne({ school: schoolId });

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    let response: any;
    let extension: number =
      plan.duration + SETTINGS_CONSTANTS.SUBSCRIPTION_EXTENSION;

    if (userPayment.type === PAYMENT_TYPES.PAYSTACK) {
      response = await paymentService.PaystackRecurringPayment(
        userPayment.authorizationCode,
        userPayment.email,
        plan.cost * 100
      );

      if (
        !response ||
        response.status !== true ||
        response.data.gateway_response.toLowerCase() !== "approved"
      ) {
        throw new BadRequestError("unable to initialize recurring charge");
      }

      let payment: any = new Payment({
        email: userPayment.email,
        cost: plan.cost,
        currency: plan.currency,
        country: plan.country,
        school: userPayment.school,
        student: studentId,
        subscriptionPlanId: plan._id,
        reference: response.data.reference,
        status: response.data.status,
        autoRenew: true,
        type: PAYMENT_TYPES.PAYSTACK,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: payment.reference,
        cost: payment.cost,
        currency: plan.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.COMPLETED,
        channel: response.data.channel,
        email: userPayment.email,
        txnFrom: userPayment.school,
        subscriptionPlanId: plan._id,
        transactionDate: response.data.transaction_date,
      });

      transaction.save();
    }

    if (userPayment.type === PAYMENT_TYPES.FLUTTERWAVE) {
      let generatedReference = generator.generate({
        length: 15,
        numbers: true,
      });

      response = await paymentService.FlutterwaveRecurringPayment(
        userPayment.token,
        userPayment.email,
        plan.cost,
        userPayment.currency,
        generatedReference
      );

      if (
        !response ||
        response.status.toLowerCase() !== "success" ||
        response.data.processor_response.toLowerCase() !== "approved"
      ) {
        throw new BadRequestError("unable to initialize recurring charge");
      }

      let payment: any = new Payment({
        email: userPayment.email,
        cost: plan.cost,
        currency: plan.currency,
        country: plan.country,
        school: userPayment.school,
        student: studentId,
        subscriptionPlanId: plan._id,
        reference: generatedReference,
        status: response.data.status,
        autoRenew: true,
        type: PAYMENT_TYPES.FLUTTERWAVE,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction: any = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: generatedReference,
        cost: plan.cost,
        currency: plan.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.COMPLETED,
        channel: response.data.payment_type,
        email: userPayment.email,
        txnFrom: userPayment.school,
        subscriptionPlanId: plan._id,
        transactionDate: response.data.created_at,
      });

      transaction.save();
    }

    if (userPayment.type === PAYMENT_TYPES.STRIPE) {
      response = await paymentService.StripeRecurringPayment(
        userPayment.customerId,
        userPayment.paymentId,
        plan.cost * 100,
        userPayment.currency
      );

      if (!response || response.status !== "succeeded") {
        throw new BadRequestError("unable to initialize recurring charge");
      }

      let payment: any = new Payment({
        email: userPayment.email,
        cost: plan.cost,
        currency: plan.currency,
        country: plan.country,
        school: userPayment.school,
        student: studentId,
        subscriptionPlanId: plan._id,
        reference: response.id,
        status: response.status,
        autoRenew: true,
        type: PAYMENT_TYPES.STRIPE,
        endDate: addDaysToDate(plan.duration),
        extensionDate: addDaysToDate(extension),
      });

      payment.save();

      let transaction = new Transaction({
        txnRef: generator.generate({
          length: 15,
          numbers: true,
        }),
        paymentRef: payment.reference,
        cost: payment.cost,
        currency: payment.currency,
        type: TRANSACTION_TYPE.SUBSCRIPTION,
        status: TRANSACTION_STATUS.COMPLETED,
        channel: response.payment_method_types[0],
        email: userPayment.email,
        txnFrom: userPayment.school,
        subscriptionPlanId: plan._id,
        transactionDate: new Date(response.created * 1000),
      });

      transaction.save();
    }

    let subscriber = await StudentSubscription.findOne({
      student: studentId,
      school: schoolId,
    });

    subscriber.subscriptionPlanId = plan._id;
    subscriber.startDate = Date.now();
    subscriber.endDate = addDaysToDate(plan.duration);
    subscriber.extensionDate = addDaysToDate(extension);
    subscriber.autoRenew = true;
    subscriber.isActive = true;

    await subscriber.save();
  }

  async studentSubscription(schoolId: string) {
    let studentSubscription = await StudentSubscription.find({
      school: schoolId,
    });
    return studentSubscription;
  }

  async doCancel(schoolId: string, body: any) {
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

  async deactivate(studentId: string) {
    let studentSubscription = await StudentSubscription.findOne({
      student: studentId,
    });
    studentSubscription.isActive = false;
    studentSubscription.save();
  }
}

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
