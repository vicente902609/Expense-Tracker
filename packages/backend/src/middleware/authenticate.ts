import type { NextFunction, Request, Response } from "express";

import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";
import { getUserById } from "../modules/users/repository.js";

export const authenticate = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
      throw new AppError("Missing authorization token", 401);
    }

    let payload: { sub: string };
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await getUserById(payload.sub);

    if (!user) {
      throw new AppError("User not found", 401);
    }

    request.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};
