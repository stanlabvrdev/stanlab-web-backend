import multer from "multer";
import fs from "fs";
import NotFoundError from "../services/exceptions/not-found";
import path from "node:path";
import { NextFunction, Request, Response } from "express";

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
      req.file.buffer = fs.readFileSync(path.resolve(req.file.path));
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

// export function awsStorage() {
//   return multerS3({
//     s3,
//     bucket,
//     acl: "public-read",
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: function (req, file, cb) {
//       cb(null, Date.now().toString());
//     },
//   });
// }

export default uploadFile;
