import { NextFunction, Request, Response } from "express";
import { ServerErrorHandler, ServerResponse } from "../../services/response/serverResponse";
import { TimeTableService } from "../../services/timetable/timetable.service";

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
      const timeTable = await TimeTableService.create(classes, days, timeRanges, activities);
      ServerResponse(req, res, 201, timeTable, "TimeTable generated successfully");
    } catch (err) {
      ServerErrorHandler(req, res, err);
    }
  }
}

const timeTableController = new TimeTableController();

export { timeTableController as TimeTableController };
