import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { loginUser, registerUser } from "./service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const result = await registerUser(request.body);
    response.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (request, response) => {
    const result = await loginUser(request.body);
    response.json(result);
  }),
);
