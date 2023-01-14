function ServerResponse(req, res, code, data, message) {
    console.log(`${req.originalUrl} - ${req.method} - ${req.ip} - ${req.code} - ${JSON.stringify(data)}`);
    res.status(code).json({
        message,
        data,
    });
}

function ServerErrorHandler(req, res, error) {
    console.log(`${req.originalUrl} - ${req.method} - ${req.ip} - ${error}`);

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