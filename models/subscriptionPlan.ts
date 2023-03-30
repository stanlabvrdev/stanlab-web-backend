import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, unique: true },
  cost: { type: Number, required: true, min: 0, trim: true },
  description: { type: String, trim: true },
});


const SubscriptionPlan = mongoose.model("SubscriptionPlan", subscriptionPlanSchema)

export { SubscriptionPlan }