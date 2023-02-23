const cloudinary = require("cloudinary").v2;

const envConfig = require("../config/env");

const env = envConfig.getAll();

cloudinary.config({
    cloud_name: "stanlab",
    api_key: env.cloudinary_api_key,
    api_secret: env.cloudinary_secret_key,
});

module.exports = { cloudinary };