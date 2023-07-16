import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export class ValidationMiddleware {
  static validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error } = schema.validate(req.body);
      if (error) {
        res.status(400).json({ message: error.details[0].message });
      } else {
        next();
      }
    };
  }
}
