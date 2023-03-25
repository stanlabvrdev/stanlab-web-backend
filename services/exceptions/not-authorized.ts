import CustomError from "./custom";

class NotAuthorizedError extends CustomError {
  constructor(message = "Not Authorized") {
    super(403, message);
  }
}

export default NotAuthorizedError;
