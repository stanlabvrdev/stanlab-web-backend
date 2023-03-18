import { v2 } from "cloudinary";

import envConfig from "../config/env";

const env = envConfig.getAll();

v2.config({
  cloud_name: "stanlab",
  api_key: env.cloudinary_api_key,
  api_secret: env.cloudinary_secret_key,
});
const cloudinary = v2;
export { cloudinary };
