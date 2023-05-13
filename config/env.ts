import dotenv from "dotenv";

dotenv.config();

class Env {
  getAll() {
    const development = "development";
    const env = process.env.NODE_ENV || development;

    if (env == "production") return this.getProduction();
    if (env == "test") {
      return this.getTest();
    }
    if (env == development) return this.getDevelopment();

    return this.getDefault();
  }
  getDefault() {
    return {
      environment: process.env.NODE_ENV,
      port: Number(process.env.PORT),

      app_name: process.env.APP_NAME,
      jwtKey: process.env.JWT_KEY,
      sendGrid_API_KEY: process.env.SENDGRID_API_KEY,
      teacher_google_CLIENT_ID: process.env.TEACHER_GOOGLE_CLIENT_ID,
      teacher_google_CLIENT_SECRET: process.env.TEACHER_GOOGLE_CLIENT_SECRET,
      student_google_CLIENT_ID: process.env.STUDENT_GOOGLE_CLIENT_ID,
      student_google_CLIENT_SECRET: process.env.STUDENT_GOODLE_CLIENT_SECRET,
      mongodb_URI: process.env.MONGODB_URL,
      stripe_Publishable_Key: process.env.STRIPE_PUBLIC_KEY,
      stripe_Secret_Key: process.env.STRIPE_SECRET_KEY,
      cloudinary_api_key: process.env.CLOUDINARY_PUBLIC_KEY,
      cloudinary_secret_key: process.env.CLOUDINARY_SECRET_KEY,
      mailgun_API_KEY: process.env.MAILGUN_API_KEY,
      aws_bucket: process.env.AWS_BUCKET,
      aws_access_key_id: process.env.AWS_S3_ACCESS_KEY,
      aws_s3_secret: process.env.AWS_S3_SECRET,
      question_generation_model: process.env.QUESTION_GENERATION_MODEL,
      paystack_payment_URL: process.env.PAYSTACK_PAYMENT_URL,
      paystack_secret_key: process.env.PAYSTACK_SECRET_KEY,
      paystack_verification_URL: process.env.PAYSTACK_VERIFICATION_URL,
      paystack_recurring_payment_URL: process.env.PAYSTACK_RECURRING_PAYMENT_URL,
      redirect_URL: process.env.REDIRECT_URL,
      free_subscription_title: process.env.FREE_SUBSCRIPTION_TITLE,
    };
  }
  getProduction() {
    return { ...this.getDefault() };
  }
  getDevelopment() {
    return { ...this.getDefault() };
  }
  getTest() {
    return { ...this.getDefault(), jwtKey: "test-key" };
  }
}

export default new Env();
