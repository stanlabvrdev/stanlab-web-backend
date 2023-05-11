import multer from "multer";
import fs from "fs";
import NotFoundError from "../services/exceptions/not-found";
import path from "node:path";

function getFileName(file) {
  const uniqueSuffix = `${Date.now()}`;
  return `${file.fieldname}-${uniqueSuffix}-${file.originalname.split(".")[0]}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = "./public/files";
    fs.mkdirSync(path, { recursive: true });

    cb(null, path);
  },

  filename: function (req, file, cb) {
    cb(null, getFileName(file));
  },
});

export const uploadFile = (fileName, fileFilter) => {
  return (req, res, next) => {
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
  return function (req, file, cb) {
    if (allowedTypes && !allowedTypes.includes(file.mimetype)) {
      const error = new Error("Invalid file type.");
      return cb(error, false);
    }
    cb(null, true);
  };
}

export default uploadFile;
