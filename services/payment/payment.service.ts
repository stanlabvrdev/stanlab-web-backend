import axios from "axios";
import envConfig from "../../config/env";
const env = envConfig.getAll();

class PaymentService {
  async PaystackInitializePayment(
    email: string,
    amount: number,
    currency: string
  ) {
    const body = {
      email: email,
      amount: amount,
      currency: currency
    };

    const { data } = await axios.post(`${env.paystack_payment_URL}`, body, {
      headers: {
        Authorization: `Bearer ${env.paystack_secret_key}`,
        "Content-Type": "application/json",
      },
    });

    return data;
  }

  async PaystackVerifyPayment(reference: string) {
    const { data } = await axios.get(
      `${env.paystack_verification_URL}/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${env.paystack_secret_key}`,
        },
      }
    );

    return data;
  }

  async PaystackRecurringPayment(
    authorizationCode: string,
    email: string,
    amount: number
  ) {
    const body = {
      authorization_code: authorizationCode,
      email: email,
      amount: amount,
    };

    const { data } = await axios.post(
      `${env.paystack_recurring_payment_URL}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${env.paystack_secret_key}`,
          "Content-Type": "application/json",
        },
      }
    );

    return data;
  }

  async FlutterwaveInitializePayment(
    tx_ref: string,
    amount: number,
    currency: string,
    redirect_url: string,
    customer: any
  ) {
    const body = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: redirect_url,
      customer: {
        email: customer,
      },
    };

    const { data } = await axios.post(`${env.flutterwave_payment_URL}`, body, {
      headers: {
        Authorization: `Bearer ${env.flutterwave_secret_key}`,
        "Content-Type": "application/json",
      },
    });

    return data;
  }

  async FlutterwaveRecurringPayment(
    token: string,
    email: string,
    amount: number,
    tx_ref: string
  ) {
    const body = {
      token: token,
      email: email,
      currency: "NGN",
      amount: amount,
      tx_ref: tx_ref,
    };

    const { data } = await axios.post(
      `${env.flutterwave_recurring_payment_URL}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${env.flutterwave_secret_key}`,
          "Content-Type": "application/json",
        },
      }
    );

    return data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
