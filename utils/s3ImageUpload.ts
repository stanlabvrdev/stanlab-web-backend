import S3 from "aws-sdk/clients/s3";
import ENV from "../config/env";
const env = ENV.getAll();
import CustomError from "../services/exceptions/custom";

export async function uploadImageToS3(file: Express.Multer.File) {
  const s3 = new S3({
    accessKeyId: env.aws_access_key_id,
    secretAccessKey: env.aws_s3_secret,
  });
  // Set up the S3 upload parameters
  const params = {
    Bucket: env.aws_bucket!,
    Key: file.originalname,
    Body: file.buffer,
    ACL: "public-read",
  };
  try {
    //upload the file to s3
    const data = await s3.upload(params).promise();
    return data.Location;
  } catch (err) {
    throw new CustomError(500, "Operation not successful");
  }
}
