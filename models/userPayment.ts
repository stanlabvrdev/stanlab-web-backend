import mongoose from "mongoose";

interface UserPaymentAttrs {
  signature: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

interface UserPaymentDoc extends mongoose.Document {
  signature: string;
  email: string;
  school: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
}

interface UserPaymentModel extends mongoose.Model<UserPaymentDoc> {
  build(attrs: UserPaymentAttrs): UserPaymentDoc;
}

const userPaymentSchema = new mongoose.Schema({
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
