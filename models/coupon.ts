import mongoose from "mongoose";

interface CouponAttrs {
  code: string;
  discount: number;
  school: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  endDate: Date;
}

interface CouponDoc extends mongoose.Document {
  code: string;
  discount: number;
  school: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  endDate: Date;
}

interface CouponModel extends mongoose.Model<CouponDoc> {
  build(attrs: CouponAttrs): CouponDoc;
}

const couponSchema = new mongoose.Schema({
  code: { type: String },
  discount: { type: Number, required: true },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SuperAdmin",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
});

const Coupon = mongoose.model("Coupon", couponSchema);

export { Coupon };
