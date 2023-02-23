const CustomError = require("./custom");

class NotAuthorizedError extends CustomError {
    constructor(message = "Not Authorized") {
        super(403, message);
    }
}

module.exports = NotAuthorizedError;