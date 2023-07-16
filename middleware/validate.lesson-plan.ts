import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction } from "express";
import BadRequestError from "../services/exceptions/bad-request";

export class ValidationMiddleware {
  static validate<T>(type: any): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
      validate(plainToInstance(type, req.body)).then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors.map((error: ValidationError) => Object.values(error.constraints || {})).join(", ");
          throw new BadRequestError(message);
        } else {
          next();
        }
      });
    };
  }
}
