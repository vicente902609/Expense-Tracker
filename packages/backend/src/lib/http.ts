import type { NextFunction, Request, Response } from "express";

export type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (handler: AsyncHandler) => (request: Request, response: Response, next: NextFunction) => {
  handler(request, response, next).catch(next);
};
