const Logger = require("../../utils/logger");

function ServerResponse(req, res, code, data, message) {
    Logger.info(`${req.originalUrl} - ${req.method} - ${req.ip} - ${req.code} - ${JSON.stringify(data)}`);
    res.status(code).json({
        message,
        data,
    });
}

function ServerErrorHandler(req, res, error) {
    Logger.info(`${req.originalUrl} - ${req.method} - ${req.ip} - ${error}`);

    const code = error.statusCode || 500;
    const message = error.message;
    const data = error.data || null;

    res.status(code).json({
        message,
        data,
    });
}

module.exports = {
    ServerResponse,
    ServerErrorHandler,
};