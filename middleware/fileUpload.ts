import multer from "multer";
//N/B: multer-s3 package v2 works with aws-sdk v2 and v3 with the corresponding v3 and vice versa, check version compatibility in package.json file
import multerS3 from "multer-s3";
import fs from "fs";
import NotFoundError from "../services/exceptions/not-found";
import path from "node:path";
import { NextFunction, Request, Response } from "express";
import AWS from "aws-sdk";
import envConfig from "../config/env";
const env = envConfig.getAll();

const bucket = env.aws_bucket;
const accessKeyId = env.aws_access_key_id;
const secretKey = env.aws_s3_secret;

const s3 = new AWS.S3({
  accessKeyId: accessKeyId,
  secretAccessKey: secretKey,
});

function getFileName(file) {
  const uniqueSuffix = `${Date.now()}`;
  return `${file.fieldname}-${uniqueSuffix}-${file.originalname.split(".")[0]}`;
}

export function diskStorage() {
  return multer.diskStorage({
    destination: function (req: Request, file, cb) {
      const path = "./public/files";
      fs.mkdirSync(path, { recursive: true });

      cb(null, path);
    },

    filename: function (req, file, cb) {
      cb(null, getFileName(file));
    },
  });
}

export const uploadFile = (fileName: string, fileFilter, storage) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const multerUploader = multer({
      storage,
      limits: {
        fileSize: 10 * 1000 * 1000,
      },
      fileFilter,
    }).single(fileName);

    multerUploader(req, res, (err) => {
      if (!req.file) throw new NotFoundError("No file found");
      if (!req.file.location) {
        req.file.buffer = fs.readFileSync(path.resolve(req.file.path));
      }
      next();
    });
  };
};

export function createFileFilter(allowedTypes?: string[]) {
  return function (req: Request, file, cb) {
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      const error = new Error("Invalid file type.");
      return cb(error, false);
    }
    cb(null, true);
  };
}

export function awsStorage() {
  return multerS3({
    s3,
    bucket,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  });
}

export default uploadFile;
