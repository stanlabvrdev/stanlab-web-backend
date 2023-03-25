import { Student } from "../models/student";
import constants from "../utils/constants";
import moment from "moment";
import { ServerErrorHandler } from "../services/response/serverResponse";

export default async function (req, res, next) {
  try {
    const student = await Student.findOne({ _id: req.student._id });
    const expired = moment(student[constants.trialPeriod.title]).diff(moment(), "s");

    if (expired <= 0) return res.status(403).send({ message: "You trial period is over" });
    else return next();
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
