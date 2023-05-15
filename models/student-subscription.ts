import mongoose from "mongoose";

interface StudentSubscriptionAttrs {
  student: mongoose.Schema.Types.ObjectId;
  school: mongoose.Schema.Types.ObjectId;
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  extensionDate: Date;
  autoRenew?: boolean;
  isActive: boolean;
}

interface StudentSubscriptionDoc extends mongoose.Document {
  student: mongoose.Schema.Types.ObjectId;
  school: mongoose.Schema.Types.ObjectId;
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  extensionDate: Date;
  autoRenew?: boolean;
  isActive: boolean;
}

interface StudentSubscriptionModel
  extends mongoose.Model<StudentSubscriptionDoc> {
  build(attrs: StudentSubscriptionAttrs): StudentSubscriptionDoc;
}

const studentSubscriptionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
    required: true,
  },
  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
    required: true,
  },
  startDate: { type: Date, default: Date.now, required: true },
  endDate: { type: Date, required: true },
  extensionDate: { type: Date, required: true },
  autoRenew: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
});

const StudentSubscription = mongoose.model(
  "StudentSubscription",
  studentSubscriptionSchema
);

export { StudentSubscription };
