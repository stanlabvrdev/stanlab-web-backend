import axios from "axios";
import envConfig from "../../config/env";
const env = envConfig.getAll();

class PaymentService {
  async initializePayment(email: string, amount: number) {
    const body = {
      email: email,
      amount: amount,
    };

    const { data } = await axios.post(`${env.paystack_payment_URL}`, body, {
      headers: {
        Authorization: `Bearer ${env.paystack_secret_key}`,
        "Content-Type": "application/json",
      },
    });

    return data;
  }

  async verifyPayment(reference: string) {
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

  async recurringPayment(
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
}

export const paymentService = new PaymentService();
export default paymentService;
