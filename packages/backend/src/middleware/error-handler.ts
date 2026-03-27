import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../lib/errors.js";

export const errorHandler = (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Validation failed",
      issues: error.issues,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    message: "Something went wrong",
  });
};
