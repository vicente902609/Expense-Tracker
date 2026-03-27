import { Router } from "express";

import { AppError } from "../../lib/errors.js";
import { asyncHandler } from "../../lib/http.js";
import { createUserGoal, listUserGoals, updateUserGoal } from "./service.js";

export const goalsRouter = Router();

const getRouteParam = (value: string | string[] | undefined) => {
  if (typeof value !== "string") {
    throw new AppError("Invalid goal id", 400);
  }

  return value;
};

goalsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const goals = await listUserGoals(request.authUser!.id);
    response.json(goals);
  }),
);

goalsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const goal = await createUserGoal(request.authUser!.id, request.body);
    response.status(201).json(goal);
  }),
);

goalsRouter.put(
  "/:goalId",
  asyncHandler(async (request, response) => {
    const goal = await updateUserGoal(request.authUser!.id, getRouteParam(request.params.goalId), request.body);
    response.json(goal);
  }),
);
