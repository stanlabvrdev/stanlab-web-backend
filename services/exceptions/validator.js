const BadRequestError = require("./bad-request");

function doValidate(validationResult) {
    const { error } = validationResult;
    if (error) {
        throw new BadRequestError(error.details[0].message);
    }
}

module.exports = {
    doValidate,
};