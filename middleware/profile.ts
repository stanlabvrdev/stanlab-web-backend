import { NextFunction, Request } from "express";
import teacherProfileService from "../services/teacher/profile.service";
import { teacherAuth } from "./auth";

class TecherProfileMiddleware {
  async insertSchool(req: Request, res, next: NextFunction) {
    const profile = await teacherProfileService.findById(req.teacher._id);

    if (profile && profile.selectedSchool) {
      req.teacher.school_id = profile.selectedSchool.toString();
    }

    next();
  }

  build() {
    return [teacherAuth, this.insertSchool];
  }
}

export const techerProfileMiddleware = new TecherProfileMiddleware();
