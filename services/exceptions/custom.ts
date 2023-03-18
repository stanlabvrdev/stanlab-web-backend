class CustomError extends Error {
  constructor(public statusCode, public message) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
  }
}

export default CustomError;
