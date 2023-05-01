import geoip from "geoip-lite";
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
import { PAYSTACK } from "../../constants/locations";

class SubscriptionService {
  async createPlan(body: any, adminId: string) {
    let { title, cost, vat, description, coupon, student_count, duration, durationType, is_active } = body;

    let existingPlan = await SubscriptionPlan.findOne({ title });
    if (existingPlan) throw new BadRequestError("subscription plan with this title already exist");

    let admin = await SuperAdmin.findById({ _id: adminId });
    if (!admin) throw new NotFoundError("admin not found");

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

  async getPlans() {
    let plans = await SubscriptionPlan.find();
    return plans;
  }

  async updatePlanById(body: any, planId: string) {
    let { title, cost, description } = body;

    let plan = await SubscriptionPlan.findById({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    plan.title = title;
    plan.cost = cost;
    plan.description = description;

    return await plan.save();
  }

  async makePayment(body: any, schoolId: string, location: string) {
    let { planId, studentId, autoRenew } = body;

    const locate = geoip.lookup(location);

    const plan = await SubscriptionPlan.findOne({ _id: planId });
    if (!plan) throw new NotFoundError("subscription plan not found");

    let school = await SchoolAdmin.findById({ _id: schoolId });

    const students = await SchoolStudent.find({
      student: studentId,
      school: school._id,
    });

    if (!students) {
      throw new BadRequestError("student not found");
    }

    let studentSub = await StudentSubscription.find({
      student: studentId,
      school: school._id,
    });

    const count = students.length - studentSub.length;

    if (count < 1) {
      throw new BadRequestError("student has an active subscription");
    }

    let response: any;

    if (locate.country in PAYSTACK) {
      response = await paymentService.initializePayment(school.email, plan.cost * 100 * count);

      if (!response || response.status !== true) {
        throw new BadRequestError("unable to initialize payment");
      }
    }

    studentId = studentId.filter((id: string) => {
      return !studentSub.some((sub: any) => sub.student.toString() === id);
    });

    let payment = new Payment({
      email: school.email,
      cost: plan.cost * count,
      school: school._id,
      student: studentId,
      subscriptionPlanId: plan._id,
      reference: response.data.reference,
      accessCode: response.data.access_code,
      authorizationUrl: response.data.authorization_url,
      status: STATUS_TYPES.PENDING,
      autoRenew,
      endDate: addDaysToDate(plan.duration),
    });

    payment.save();

    return response;
  }

  async verifyPayment(schoolId: string, reference: string) {
    let payment = await Payment.findOne({ school: schoolId, reference });

    if (!payment) {
      throw new NotFoundError("reference not found");
    }

    const response = await paymentService.verifyPayment(reference);

    if (response.data.status.toLowerCase() !== "success") {
      throw new BadRequestError(response.data.gateway_response);
    }

    payment.status = response.data.gateway_response;
    await payment.save();

    let userPayment = await UserPayment.findOne({
      school: schoolId,
      signature: response.data.authorization.signature,
    });

    if (!userPayment) {
      userPayment = new UserPayment({
        authorizationCode: response.data.authorization.authorization_code,
        cardType: response.data.authorization.card_type,
        cardLastFourDigits: response.data.authorization.last4,
        expiryMonth: response.data.authorization.exp_month,
        expiryYear: response.data.authorization.exp_year,
        bank: response.data.authorization.bank,
        signature: response.data.authorization.signature,
        email: payment.email,
        school: payment.school,
      });
      userPayment.save();
    }

    const promises: any[] = [];
    payment.student.map(async (element) => {
      let sub = new StudentSubscription({
        student: element,
        school: schoolId,
        subscriptionPlanId: payment.subscriptionPlanId,
        endDate: payment.endDate,
        autoRenew: payment.autoRenew,
      });
      promises.push(sub.save());
    });
    const studentSub = await Promise.all(promises);

    return studentSub;
  }
}

//check ip address
//cron job
//recurring payment

export const subscriptionService = new SubscriptionService();
export default subscriptionService;
