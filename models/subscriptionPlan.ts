import mongoose from "mongoose";
import { DURATION_TYPES } from "../enums/duration-types";

interface SubscriptionPlanAttrs {
  title: string;
  cost: number;
  currency: string;
  country: string;
  vat: number;
  description: string;
  coupon: string;
  student_count: number;
  duration: number;
  durationType: string;
  creator: mongoose.Schema.Types.ObjectId;
  is_active: boolean;
}

interface SubscriptionPlanDoc extends mongoose.Document {
  title: string;
  cost: number;
  currency: string;
  country: string;
  vat: number;
  description: string;
  coupon: string;
  student_count: number;
  duration: number;
  durationType: string;
  creator: mongoose.Schema.Types.ObjectId;
  is_active: boolean;
}

interface SubscriptionPlanModel extends mongoose.Model<SubscriptionPlanDoc> {
  build(attrs: SubscriptionPlanAttrs): SubscriptionPlanDoc;
}

const subscriptionPlanSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  cost: { type: Number, required: true, min: 0, trim: true },
  currency: { type: String },
  country: { type: String },
  vat: { type: Number, required: true, min: 0, trim: true },
  description: { type: String, trim: true },
  coupon: { type: String, trim: true },
  student_count: { type: Number, trim: true },
  duration: { type: Number, required: true, trim: true },
  durationType: {
    type: String,
    enum: DURATION_TYPES,
    required: true,
    trim: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdmin",
  },
  is_active: { type: Boolean, trim: true, default: true },
});

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

export { SubscriptionPlan };
