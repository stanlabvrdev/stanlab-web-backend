class CustomError extends Error {
    constructor(statusCode, message, data) {
        super(message);

        this.statusCode = statusCode;
        this.message = message;
    }
}

module.exports = CustomError;