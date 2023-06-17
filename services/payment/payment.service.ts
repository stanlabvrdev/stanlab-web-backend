import axios from "axios";
import envConfig from "../../config/env";
const env = envConfig.getAll();
const stripe = require("stripe")(env.stripe_Secret_Key);

class PaymentService {
  async makePostRequest(url: string, body: object, headers: object) {
    const { data } = await axios.post(url, body, {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });

    return data;
  }

  async makeGetRequest(url: string, headers: object) {
    const { data } = await axios.get(url, {
      headers,
    });

    return data;
  }

  //Paystack initializae payment
  async PaystackInitializePayment(email: string, amount: number, currency: string, redirect_url: string) {
    const body = {
      email: email,
      amount: amount,
      currency: currency,
      callback_url: redirect_url,
    };

    return this.makePostRequest(env.paystack_payment_URL, body, { Authorization: `Bearer ${env.paystack_secret_key}` });
  }

  //Paystack verify payment
  async PaystackVerifyPayment(reference: string) {
    return this.makeGetRequest(`${env.paystack_verification_URL}/${reference}`, { Authorization: `Bearer ${env.paystack_secret_key}` });
  }

  //PayStack recurring payment
  async PaystackRecurringPayment(authorizationCode: string, email: string, amount: number) {
    const body = {
      authorization_code: authorizationCode,
      email: email,
      amount: amount,
    };

    return this.makePostRequest(env.paystack_recurring_payment_URL, body, { Authorization: `Bearer ${env.paystack_secret_key}` });
  }

  //Flutterwave initialize payment
  async FlutterwaveInitializePayment(tx_ref: string, amount: number, currency: string, redirect_url: string, customer: any) {
    const body = {
      tx_ref: tx_ref,
      amount: amount,
      currency: currency,
      redirect_url: redirect_url,
      customer: {
        email: customer,
      },
    };

    return this.makePostRequest(env.flutterwave_payment_URL, body, { Authorization: `Bearer ${env.flutterwave_secret_key}` });
  }

  async FlutterwaveRecurringPayment(token: string, email: string, amount: number, currency: string, tx_ref: string) {
    const body = {
      token: token,
      email: email,
      currency: currency,
      amount: amount,
      tx_ref: tx_ref,
    };
    return this.makePostRequest(env.flutterwave_recurring_payment_URL, body, { Authorization: `Bearer ${env.flutterwave_secret_key}` });
  }

  async StripeInitializePayment(email: string, amount: number, currency: string, name: string) {
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

  async StripeRecurringPayment(customerId: string, paymentId: string, amount: number, currency: string) {
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
