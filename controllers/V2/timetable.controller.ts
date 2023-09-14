import { NextFunction, Request, Response } from "express";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { timetableService } from "../../services/timetable/timetable.service";

interface RequestWithSchool extends Request {
  school: {
    _id: string;
  };
}

class TimeTableController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { classes, days, timeRanges, activities } = req.body;
      // const scheduleInput = {
      //   classes: [
      //     { classid: "1", classname: "1A" },
      //     { classid: "2", classname: "1B" },
      //   ],
      //   days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      //   timeRanges: ["8:00-9:00", "9:00-10:00", "10:00-11:00", "11:00-12:00"],
      //   activities: [
      //     { isTimeFixed: false, name: "Maths", Teacher: {id: "1", name: Mr. Smith"} },
      //     { isTimeFixed: false, name: "English", Teacher:{id: "2", name: "Ms. Johnson"} },
      //     { isTimeFixed: true, name: "Science", TimeRange: "8:00-9:00" },
      //   ],
      // };
      const timeTable = await timetableService.generate(classes, days, timeRanges, activities);
      ServerResponse(req, res, 201, timeTable, "TimeTable generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async saveGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const savedTimeTable = await timetableService.save(req.body, admin);
      ServerResponse(req, res, 201, savedTimeTable, "TimeTable saved successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async getGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const timetable = await timetableService.getGroup(id, admin);
      ServerResponse(req, res, 200, timetable, "TimeTable Fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const timetables = await timetableService.getGroups(admin);
      ServerResponse(req, res, 200, timetables, "TimeTables Fetched successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async modifyGroupMetadata(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const updatedTimetable = await timetableService.modifyGroupMetadata(
        req.params.id,
        admin,
        req.body
      );
      ServerResponse(req, res, 200, updatedTimetable, "TimeTable updated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async deleteGroup(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const updatedTimetable = await timetableService.deleteGroup(req.params.id, admin);
      ServerResponse(req, res, 200, updatedTimetable, "TimeTable deleted successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async generateShareablelink(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const updatedTimetable = await timetableService.generateShareablelink(req.params.id, admin);
      ServerResponse(req, res, 200, updatedTimetable, "Link generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
  async getSharedTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const timetable = await timetableService.getSharedTimetable(req.params.id);
      ServerResponse(req, res, 200, timetable, "Successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async addTeachersToTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const { teachers } = req.body;
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const timetable = await timetableService.addTeachersToTimetable(
        admin,
        teachers,
        req.params.id
      );
      ServerResponse(req, res, 200, timetable, "Successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async getTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const timetable = await timetableService.getATimetable(admin, id);
      ServerResponse(req, res, 200, timetable, "Successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
  async getTimetables(req: Request, res: Response, next: NextFunction) {
    try {
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      const timetables = await timetableService.getAllTimetables(admin);
      console.log(timetables);
      ServerResponse(req, res, 200, timetables, "Successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }

  async deleteTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const schoolRequest = req as RequestWithSchool;
      const admin = schoolRequest.school._id;
      await timetableService.deleteTimetable(admin, id);
      ServerResponse(req, res, 200, null, "Successful");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
}

const timeTableController = new TimeTableController();

export { timeTableController as TimeTableController };
