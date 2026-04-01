import {
  loginBodySchema,
  logoutRequestSchema,
  refreshRequestSchema,
  registerBodySchema,
} from "@expense-tracker/shared";
import { Router } from "express";

import { sendBadRequest, sendConflict, sendCreated, sendInternalError, sendOk, sendUnauthorized } from "../../lib/api-response.js";
import { verifyAccessToken } from "../../lib/jwt.js";
import { loginUser, logoutUser, refreshTokens, registerUser } from "./service.js";

export const authRouter = Router();

authRouter.post("/register", async (request, response) => {
  try {
    const parsed = registerBodySchema.safeParse(request.body);
    if (!parsed.success) {
      sendBadRequest(response, parsed.error.flatten().fieldErrors);
      return;
    }

    const { email, password, name } = parsed.data;
    const result = await registerUser(email, password, name);

    if (result === "EMAIL_TAKEN") {
      sendConflict(response, "An account with this email already exists");
      return;
    }

    sendCreated(response, result);
  } catch {
    sendInternalError(response);
  }
});

authRouter.post("/login", async (request, response) => {
  try {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      sendBadRequest(response, parsed.error.flatten().fieldErrors);
      return;
    }

    const { email, password } = parsed.data;
    const result = await loginUser(email, password);

    if (result === "INVALID_CREDENTIALS") {
      sendUnauthorized(response, "Invalid email or password");
      return;
    }

    sendOk(response, result);
  } catch {
    sendInternalError(response);
  }
});

authRouter.post("/refresh", async (request, response) => {
  try {
    const parsed = refreshRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendBadRequest(response, parsed.error.flatten().fieldErrors);
      return;
    }

    const result = await refreshTokens(parsed.data.refreshToken);

    if (result === "INVALID_TOKEN") {
      sendUnauthorized(response, "Invalid or expired refresh token");
      return;
    }

    sendOk(response, result);
  } catch {
    sendInternalError(response);
  }
});

authRouter.post("/logout", async (request, response) => {
  try {
    const parsed = logoutRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      sendBadRequest(response, parsed.error.flatten().fieldErrors);
      return;
    }

    const { refreshToken } = parsed.data;
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
      sendUnauthorized(response, "Missing authorization token");
      return;
    }

    let userId: string;
    try {
      userId = verifyAccessToken(token).sub;
    } catch {
      sendUnauthorized(response, "Invalid or expired token");
      return;
    }

    await logoutUser(userId, refreshToken);
    sendOk(response, { message: "Logged out successfully" });
  } catch {
    sendInternalError(response);
  }
});
