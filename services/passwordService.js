const bcrypt = require("bcryptjs");

class PasswordService {
    async hash(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}

const passwordService = new PasswordService();

exports.passwordService = passwordService;