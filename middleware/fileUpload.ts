import multer from "multer";
import fs from "fs";
import NotFoundError from "../services/exceptions/not-found";

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

export const uploadFile = (fileName) => {
  return (req, res, next) => {
    const multerUploader = multer({
      storage,
      limits: {
        fileSize: 10 * 1000 * 1000,
      },
      fileFilter: function (req, file, cb) {
        return cb(null, true);
      },
    }).single(fileName);

    multerUploader(req, res, (err) => {
      if (!req.file) throw new NotFoundError("no file found");

      next();
    });
  };
};

export default uploadFile;
