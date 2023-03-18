import { Student } from "../models/student";
import { ServerErrorHandler } from "../services/response/serverResponse";

async function isFreelanceStudent(req, res, next) {
  if (!req.student) return res.status(403).send({ message: "Not authenticated" });

  try {
    const student = await Student.findOne({ _id: req.student._id });
    if (!student.school) return next();

    return res.status(403).send({
      message: "You cannot perform this operation, please ask your school",
    });
  } catch (error) {
    ServerErrorHandler(req, res, error);
  }
}

export { isFreelanceStudent };
