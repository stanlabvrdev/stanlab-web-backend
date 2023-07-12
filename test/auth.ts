import crypto from "crypto";
import moment from "moment";
import { EmailToken } from "../models/emailToken";

export async function resetPassword(entity, data) {
  const token = crypto.randomBytes(40).toString("hex");
  const expiry = moment().add(2, "hours");

  const emailToken = new EmailToken({
    token,
    expiredAt: expiry,
    [entity]: data._id,
  });

  return emailToken.save();
}
