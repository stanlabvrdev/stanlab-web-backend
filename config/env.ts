import dotenv from "dotenv";

dotenv.config();

interface IEnv {
  environment: string;
  port: number;

  app_name: string;
  jwtKey: string;
  sendGrid_API_KEY: string;
  teacher_google_CLIENT_ID: string;
  teacher_google_CLIENT_SECRET: string;
  student_google_CLIENT_ID: string;
  student_google_CLIENT_SECRET: string;
  mongodb_URI: string;
  stripe_Publishable_Key: string;
  stripe_Secret_Key: string;
  cloudinary_api_key: string;
  cloudinary_secret_key: string;
  mailgun_API_KEY: string;
  aws_bucket: string;
  aws_access_key_id: string;
  aws_s3_secret: string;
  question_generation_model: string;
  true_or_false_model: string;
  paystack_payment_URL: string;
  paystack_secret_key: string;
  paystack_verification_URL: string;
  paystack_recurring_payment_URL: string;
  redirect_URL: string;
  free_subscription_title: string;
  flutterwave_secret_key: string;
  flutterwave_secret_hash: string;
  flutterwave_payment_URL: string;
  flutterwave_public_key: string;
  flutterwave_recurring_payment_URL: string;
}

class Env {
  getAll(): IEnv {
    const development = "development";
    const env = process.env.NODE_ENV || development;

    if (env == "production") return this.getProduction();
    if (env == "test") {
      return this.getTest();
    }
    if (env == development) return this.getDevelopment();

    return this.getDefault();
  }
  getDefault(): IEnv {
    return {
      environment: process.env.NODE_ENV!,
      port: Number(process.env.PORT)!,

      app_name: process.env.APP_NAME!,
      jwtKey: process.env.JWT_KEY!,
      sendGrid_API_KEY: process.env.SENDGRID_API_KEY!,
      teacher_google_CLIENT_ID: process.env.TEACHER_GOOGLE_CLIENT_ID!,
      teacher_google_CLIENT_SECRET: process.env.TEACHER_GOOGLE_CLIENT_SECRET!,
      student_google_CLIENT_ID: process.env.STUDENT_GOOGLE_CLIENT_ID!,
      student_google_CLIENT_SECRET: process.env.STUDENT_GOODLE_CLIENT_SECRET!,
      mongodb_URI: process.env.MONGODB_URL!,
      stripe_Publishable_Key: process.env.STRIPE_PUBLIC_KEY!,
      stripe_Secret_Key: process.env.STRIPE_SECRET_KEY!,
      cloudinary_api_key: process.env.CLOUDINARY_PUBLIC_KEY!,
      cloudinary_secret_key: process.env.CLOUDINARY_SECRET_KEY!,
      mailgun_API_KEY: process.env.MAILGUN_API_KEY!,
      aws_bucket: process.env.AWS_BUCKET!,
      aws_access_key_id: process.env.AWS_S3_ACCESS_KEY!,
      aws_s3_secret: process.env.AWS_S3_SECRET!,
      question_generation_model: process.env.QUESTION_GENERATION_MODEL!,
      true_or_false_model: process.env.TRUE_OR_FALSE_MODEL!,
      paystack_payment_URL: process.env.PAYSTACK_PAYMENT_URL!,
      paystack_secret_key: process.env.PAYSTACK_SECRET_KEY!,
      paystack_verification_URL: process.env.PAYSTACK_VERIFICATION_URL!,
      paystack_recurring_payment_URL: process.env.PAYSTACK_RECURRING_PAYMENT_URL!,
      redirect_URL: process.env.REDIRECT_URL!,
      free_subscription_title: process.env.FREE_SUBSCRIPTION_TITLE!,

      flutterwave_payment_URL: process.env.FLUTTERWAVE_PAYMENT_URL!,
      flutterwave_secret_key: process.env.FLUTTERWAVE_SECRET_KEY!,
      flutterwave_public_key: process.env.FLUTTERWAVE_PUBLIC_KEY!,
      flutterwave_secret_hash: process.env.FLUTTERWAVE_SECRET_HASH!,
      flutterwave_recurring_payment_URL: process.env.FLUTTERWAVE_RECURRING_PAYMENT_URL!,
    };
  }
  getProduction() {
    return { ...this.getDefault() };
  }
  getDevelopment() {
    return { ...this.getDefault() };
  }
  getTest(): IEnv {
    return {
      ...this.getDefault(),
      jwtKey: "test-key",
      mailgun_API_KEY: "MG.test",
      sendGrid_API_KEY: "SG.test",
      student_google_CLIENT_ID: "student-test-id",
      student_google_CLIENT_SECRET: "student-test-secret",
      teacher_google_CLIENT_ID: "teacher-test-id",
      teacher_google_CLIENT_SECRET: "teacher-secret",
      aws_bucket: "aws-bucket",
      aws_access_key_id: "aws-access-key",
      aws_s3_secret: "aws-s3-secret",
      question_generation_model: "question-gen-endpoint",
      true_or_false_model: "true_or_false_model",
    };
  }
}

export default new Env();
