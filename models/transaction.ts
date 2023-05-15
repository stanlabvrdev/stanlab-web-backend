import mongoose from "mongoose";
import {
  TRANSACTION_STATUS,
  TRANSACTION_TYPE,
} from "../enums/transaction.enum";

interface TransactionAttrs {
  txnRef: string;
  paymentRef: string;
  cost: number;
  currency: string;
  type: TRANSACTION_TYPE;
  status: TRANSACTION_STATUS;
  channel: string;
  email: string;
  txnFrom: mongoose.Schema.Types.ObjectId;
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  transactionDate: Date;
}

interface TransactionDoc extends mongoose.Document {
  txnRef: string;
  paymentRef: string;
  cost: number;
  currency: string;
  type: TRANSACTION_TYPE;
  status: TRANSACTION_STATUS;
  channel: string;
  email: string;
  txnFrom: mongoose.Schema.Types.ObjectId;
  subscriptionPlanId: mongoose.Schema.Types.ObjectId;
  transactionDate: Date;
}

interface TransactionModel extends mongoose.Model<TransactionDoc> {
  build(attrs: TransactionAttrs): TransactionDoc;
}

const transactionSchema = new mongoose.Schema({
  txnRef: { type: String, required: true, unique: true, immutable: true },
  paymentRef: { type: String, required: true, unique: true, immutable: true },
  cost: { type: Number, required: true },
  currency: { type: String, required: true },
  type: {
    type: String,
    enum: TRANSACTION_TYPE,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: TRANSACTION_STATUS,
    required: true,
    trim: true,
  },
  channel: { type: String },
  email: { type: String, required: true },
  txnFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SchoolAdmin",
  },
  subscriptionPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubscriptionPlan",
  },
  transactionDate: { type: Date },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

export { Transaction };
