import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { getUserById } from "../modules/users/repository.js";

type JwtPayload = {
  sub: string;
};

export const authenticate = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
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
