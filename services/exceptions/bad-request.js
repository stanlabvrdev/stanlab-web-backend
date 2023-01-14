const CustomError = require("./custom");

class BadRequestError extends CustomError {
    constructor(message = "Not Found") {
        super(400, message);
    }
}

module.exports = BadRequestError;