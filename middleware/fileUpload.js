const multer = require("multer");
const fs = require("fs");
const NotFoundError = require("../services/exceptions/not-found");

function getFileName(file) {
    const uniqueSuffix = `${Date.now()}`;
    return `${file.fieldname}-${uniqueSuffix}-${file.originalname.split(".")[0]}`;
}

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const path = "./public/files";
        fs.mkdirSync(path, { recursive: true });

        cb(null, path);
    },

    filename: function(req, file, cb) {
        cb(null, getFileName(file));
    },
});

const uploadFile = (req, res, next) => {
    const multerUploader = multer({
        storage,
        limits: {
            fileSize: 10 * 1000 * 1000,
        },
        fileFilter: function(req, file, cb) {
            return cb(null, true);
        },
    }).single("students-file");

    multerUploader(req, res, (err) => {
        if (!req.file) throw new NotFoundError("no file found");

        next();
    });
};

exports.uploadFile = uploadFile;