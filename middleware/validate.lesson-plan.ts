import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ServerErrorHandler } from "../services/response/serverResponse";
import BadRequestError from "../services/exceptions/bad-request";

export class ValidationMiddleware {
  static validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      try {
        if (error) {
          throw new BadRequestError(error.details[0].message);
        }
          next();
        
      } catch (err) {
        ServerErrorHandler(req, res, err);
      }
    };
  }
}
