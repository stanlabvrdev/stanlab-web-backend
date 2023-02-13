const NotFoundError = require("./exceptions/not-found");
const fs = require("fs");
const xlsx = require("xlsx");

class ExcelParserService {
    async convertToJSON(req) {
        const { path } = req.file;

        if (!path) throw new NotFoundError("file not found");

        const data = await this.parseExcel(path);

        fs.unlinkSync(path);

        return data;
    }

    async parseExcel(path) {
        const wb = await xlsx.readFile(path);

        const sheet = wb.Sheets[wb.SheetNames[0]];

        return xlsx.utils.sheet_to_json(sheet, { defval: "" });
    }
}

const excelParserService = new ExcelParserService();

exports.excelParserService = excelParserService;