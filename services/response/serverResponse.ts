import { Request, Response } from "express";
import Logger from "../../utils/logger";

function ServerResponse(req: Request, res: Response, code: number, data: any, message: string | null) {
  Logger.info(`${req.originalUrl} - ${req.method} - ${req.ip} - ${req.statusCode} - ${JSON.stringify(data)}`);
  res.status(code).json({
    message,
    data,
  });
}

function ServerErrorHandler(req: Request, res: Response, error: any) {
  Logger.info(`${req.originalUrl} - ${req.method} - ${req.ip} - ${error}`);

  const code = error.statusCode || 500;
  const message = error.message;
  const data = error.data || null;

  res.status(code).json({
    message,
    data,
  });
}

export { ServerResponse, ServerErrorHandler };
