import CustomError from "./custom";

class BadRequestError extends CustomError {
  constructor(message = "Not Found") {
    super(400, message);
  }
}

export default BadRequestError;
