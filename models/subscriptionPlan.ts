import mongoose from "mongoose";
import envConfig from "../config/env";
const env = envConfig.getAll();
import {DURATION_TYPES} from "../constants/duration-types"

const types = [DURATION_TYPES.days, DURATION_TYPES.months, DURATION_TYPES.year]

interface SubscriptionPlanAttrs {
  title: string;
  cost: number;
  vat: number;
  description: string;
  coupon: string;
  student_count: number;
  duration: string;
  durationType: string;
  creator: string;
  is_active: boolean;
}

interface SubscriptionPlanDoc extends mongoose.Document {
  title: string;
  cost: number;
  vat: number;
  description: string;
  coupon: string;
  student_count: number;
  duration: number;
  durationType: string;
  creator: string;
  is_active: boolean;
}

interface SubscriptionPlanModel extends mongoose.Model<SubscriptionPlanDoc> {
  build(attrs: SubscriptionPlanAttrs): SubscriptionPlanDoc;
}

const subscriptionPlanSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  cost: { type: Number, required: true, min: 0, trim: true },
  vat: { type: Number, required: true, min: 0, trim: true },
  description: { type: String, trim: true },
  coupon: { type: String, trim: true },
  student_count: { type: Number, trim: true },
  duration: { type: String, required: true, trim: true },
  durationType: { type: String, enum: types, required: true, trim: true },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdmin",
    required: true,
  },
  is_active: { type: Boolean, trim: true },
});

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  subscriptionPlanSchema
);

export { SubscriptionPlan };
