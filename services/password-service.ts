import bcrypt from "bcryptjs";

class PasswordService {
  async hash(password: string) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}

export const passwordService = new PasswordService();
