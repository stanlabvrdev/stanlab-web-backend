import BadRequestError from "./bad-request";

function doValidate(validationResult) {
  const { error } = validationResult;
  if (error) {
    throw new BadRequestError(error.details[0].message);
  }
}

export { doValidate };
