import mongoose from "mongoose";

interface UserPaymentAttrs {
  authorizationCode: string;
  cardType: string;
  cardLastFourDigits: number;
  expiryMonth: number;
  expiryYear: number;
  bank: string;
  signature: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

interface UserPaymentDoc extends mongoose.Document {
  authorizationCode: string;
  cardType: string;
  cardLastFourDigits: number;
  expiryMonth: number;
  expiryYear: number;
  bank: string;
  signature: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

interface UserPaymentModel extends mongoose.Model<UserPaymentDoc> {
  build(attrs: UserPaymentAttrs): UserPaymentDoc;
}

const userPaymentSchema = new mongoose.Schema({
  authorizationCode: { type: String, trim: true, immutable: true },
  cardType: { type: String, trim: true, immutable: true },
  cardLastFourDigits: { type: Number, trim: true, immutable: true },
  expiryMonth: { type: Number, trim: true, immutable: true },
  expiryYear: { type: Number, trim: true, immutable: true },
  bank: { type: String, trim: true, immutable: true },
  signature: { type: String, trim: true, immutable: true },
  email: { type: String, trim: true, immutable: true },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
  createdAt: { type: Date, default: Date.now },
});

const UserPayment = mongoose.model("UserPayment", userPaymentSchema);

export { UserPayment };
