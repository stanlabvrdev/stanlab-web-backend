import mongoose from "mongoose";

interface UserPaymentAttrs {
  authorizationCode: string;
  signature: string;
  token: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  type: string;
  createdAt: Date;
}

interface UserPaymentDoc extends mongoose.Document {
  authorizationCode: string;
  signature: string;
  token: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  type: string;
  createdAt: Date;
}

interface UserPaymentModel extends mongoose.Model<UserPaymentDoc> {
  build(attrs: UserPaymentAttrs): UserPaymentDoc;
}

const userPaymentSchema = new mongoose.Schema({
  authorizationCode: { type: String, trim: true, immutable: true },
  signature: { type: String, trim: true, immutable: true },
  token: { type: String, trim: true, immutable: true },
  email: { type: String, trim: true, immutable: true },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
  type: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const UserPayment = mongoose.model("UserPayment", userPaymentSchema);

export { UserPayment };
