import CustomError from "./custom";

class NotFoundError extends CustomError {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

export default NotFoundError;
