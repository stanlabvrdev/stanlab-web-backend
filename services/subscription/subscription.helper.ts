import { PAYMENT_TYPES } from "../../enums/payment-types";
import { TRANSACTION_STATUS, TRANSACTION_TYPE } from "../../enums/transaction.enum";

export interface PaymentInterface {
  email: string;
  cost: number;
  currency: string;
  country: string;
  school: string;
  student: string;
  subscriptionPlanId: string;
  reference?: string;
  accessCode?: string;
  authorizationUrl?: string;
  status: TRANSACTION_STATUS;
  autoRenew: Boolean;
  type?: PAYMENT_TYPES;
  endDate: string;
  extensionDate: string;
}

export interface TransactionInterface {
  txnRef: string;
  paymentRef?: string;
  cost: number;
  currency: string;
  type: TRANSACTION_TYPE;
  status: TRANSACTION_STATUS;
  email: string;
  txnFrom: string;
  subscriptionPlanId: string;
}

export interface UserPaymentInterface {
  token?: string;
  signature?: string;
  authorizationCode?: string;
  customerId?: string;
  paymentId?: string;
  email: string;
  currency: string;
  school: string;
  type?: PAYMENT_TYPES;
}
