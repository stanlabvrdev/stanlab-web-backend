import mongoose from "mongoose";

interface PaymentAttrs {
  email: string;
  cost: number;
  school: mongoose.Schema.Types.ObjectId;
  student: mongoose.Schema.Types.ObjectId[];
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  status: string;
  autoRenew: boolean;
  createdAt: Date;
  endDate: Date;
}

interface PaymentDoc extends mongoose.Document {
  email: string;
  cost: number;
  school: mongoose.Schema.Types.ObjectId;
  student: mongoose.Schema.Types.ObjectId[];
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  status: string;
  autoRenew: boolean;
  createdAt: Date;
  endDate: Date;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema({
  email: { type: String, required: true },
  cost: { type: Number, required: true, immutable: true },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
  student: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  }],

  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
  },
  reference: { type: String, immutable: true },
  accessCode: { type: String },
  authorizationUrl: { type: String },
  status: { type: String },
  autoRenew: { type: Boolean },
  createdAt: { type: Date, default: Date.now },
  endDate: { type: Date },
});

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };
