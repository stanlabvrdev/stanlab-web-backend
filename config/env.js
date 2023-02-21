const dotenv = require("dotenv");

dotenv.config();

class Env {
    getAll() {
        const development = "development";
        const env = process.env.NODE_ENV || development;

        if (env == "production") return this.getProduction();
        if (env == development) return this.getDevelopment();
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
        };
    }
    getProduction() {
        return {...this.getDefault() };
    }
    getDevelopment() {
        return {...this.getDefault() };
    }
}

module.exports = new Env();