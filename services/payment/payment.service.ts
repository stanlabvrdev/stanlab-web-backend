import axios from "axios";
import envConfig from "../../config/env";
const env = envConfig.getAll();
const stripe = require("stripe")(env.stripe_Secret_Key);

class PaymentService {
  async PaystackInitializePayment(
    email: string,
    amount: number,
    currency: string,
    redirect_url: string
  ) {
    const body = {
      email: email,
      amount: amount,
      currency: currency,
      callback_url: redirect_url,
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
    currency: string,
    tx_ref: string
  ) {
    const body = {
      token: token,
      email: email,
      currency: currency,
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

  async StripeInitializePayment(
    email: string,
    amount: number,
    currency: string,
    name: string
  ) {
    const customer = await stripe.customers.create({
      email: email,
    });

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: name,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: env.redirect_URL,
      cancel_url: env.redirect_URL,
    });
    return session;
  }

  async StripeVerifyPayment(reference: string) {
    const session = stripe.checkout.sessions.retrieve(reference);

    return session;
  }

  async StripeRecurringPayment(
    customerId: string,
    paymentId: string,
    amount: number,
    currency: string
  ) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customerId,
      payment_method: paymentId,
      off_session: true,
      confirm: true,
    });

    const data = await stripe.paymentIntents.confirm(paymentIntent.id);
    return data;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
