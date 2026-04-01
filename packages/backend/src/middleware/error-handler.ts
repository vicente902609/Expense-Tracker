import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../lib/errors.js";

/** Align JSON error shape with new-backend (`lib/response.ts`) for the same client. */
export const errorHandler = (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      success: false,
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error(error);

  response.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
