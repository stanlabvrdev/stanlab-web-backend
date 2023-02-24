const NotFoundError = require("./exceptions/not-found");
const fs = require("fs");
const xlsx = require("xlsx");

class CSVUploaderService {
    upload(data, sheetName) {
        const config = {
            Bucket: "",
            Key: "",
            Body: "",
        };
    }
}

const csvUploaderService = new CSVUploaderService();

exports.csvUploaderService = csvUploaderService;