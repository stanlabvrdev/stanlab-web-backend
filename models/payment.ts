import mongoose from "mongoose";
import { PAYMENT_TYPES } from "../enums/payemt-types";

interface PaymentAttrs {
  email: string;
  cost: number;
  currency: string;
  country: string;
  school: mongoose.Schema.Types.ObjectId;
  student: mongoose.Schema.Types.ObjectId[];
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  status: string;
  autoRenew: boolean;
  type: PAYMENT_TYPES;
  createdAt: Date;
  endDate: Date;
  extensionDate: Date;
}

interface PaymentDoc extends mongoose.Document {
  email: string;
  cost: number;
  currency: string;
  country: string;
  school: mongoose.Schema.Types.ObjectId;
  student: mongoose.Schema.Types.ObjectId[];
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  reference: string;
  accessCode: string;
  authorizationUrl: string;
  status: string;
  autoRenew: boolean;
  type: PAYMENT_TYPES;
  createdAt: Date;
  endDate: Date;
  extensionDate: Date;
}

interface PaymentModel extends mongoose.Model<PaymentDoc> {
  build(attrs: PaymentAttrs): PaymentDoc;
}

const paymentSchema = new mongoose.Schema({
  email: { type: String, required: true },
  cost: { type: Number, required: true, immutable: true },
  currency: { type: String, required: true },
  country: { type: String, required: true },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
  student: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],

  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
  },
  reference: { type: String, immutable: true },
  accessCode: { type: String },
  authorizationUrl: { type: String },
  status: { type: String },
  autoRenew: { type: Boolean },
  type: { type: String, enum: PAYMENT_TYPES, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  endDate: { type: Date },
  extensionDate: { type: Date },
});

const Payment = mongoose.model("Payment", paymentSchema);

export { Payment };
