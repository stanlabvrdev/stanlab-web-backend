const NotFoundError = require("./exceptions/not-found");
const fs = require("fs");
const AWS = require("aws-sdk");

const envConfig = require("../config/env");
const { excelParserService } = require("./excelParserService");
const env = envConfig.getAll();

const bucket = env.aws_bucket;
const accessKeyId = env.aws_access_key_id;
const secretKey = env.aws_s3_secret;

const s3 = new AWS.S3({
    accessKeyId: accessKeyId,
    secretAccessKey: secretKey,
});

const CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CONTENT_READ = "public-read";

class CSVUploaderService {
    getCsv(data, key, sheetName) {
        const file = excelParserService.generateReport(data, sheetName, key);

        const _key = `${new Date()}-${key}.xlsx`;

        return this.doUpload(file, _key);
    }
    doUpload(data, key) {
        const config = {
            Bucket: bucket,
            Key: key,
            Body: data,
            ContentType: CONTENT_TYPE,
            ACL: CONTENT_READ,
        };

        return s3.upload(config).promise();
    }
}

const csvUploaderService = new CSVUploaderService();

exports.csvUploaderService = csvUploaderService;