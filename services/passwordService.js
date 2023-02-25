const bcrypt = require("bcryptjs");

class PasswordService {
  async hash(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async compare(password, dbPassword) {
    const isEqual = await bcrypt.compare(password, dbPassword);
    if (!isEqual) {
      return reject({
        code: 400,
        message: "Password incorrect",
      });
    }
  }
}

const passwordService = new PasswordService();

exports.passwordService = passwordService;
