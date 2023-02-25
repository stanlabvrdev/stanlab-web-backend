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

    generateReport(data, sheetName) {
        const workbook = xlsx.utils.book_new();

        const worksheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
        return xlsx.write(workbook, {
            bookType: "xlsx",
            type: "buffer",
        });
    }
}

const excelParserService = new ExcelParserService();

exports.excelParserService = excelParserService;