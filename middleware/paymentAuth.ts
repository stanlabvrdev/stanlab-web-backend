import { Student } from "../models/student";
import { ServerErrorHandler } from "../services/response/serverResponse";
import constants from "../utils/constants";

export default async function (req, res, next) {
  try {
    const student = await Student.findOne({ _id: req.student._id });
    if (!student) return res.status(404).send({ message: "Student not found" });
    const plan = student.plan.name;

    if (!plan || student.teachers.length < 1) return next();

    if (plan && plan === constants.plans.basic && student.teachers.length === 1) {
      return res.status(401).send({
        message: "You have exceeded the number of teacher you can add",
      });
    }
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}
