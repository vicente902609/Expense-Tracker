import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { createUserGoal, deleteUserGoal, getUserGoal, updateUserGoal } from "./service.js";

export const goalsRouter = Router();

goalsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const goal = await getUserGoal(request.authUser!.id);
    if (!goal) {
      response.status(404).json({ message: "No goal found for this user" });
      return;
    }
    response.json(goal);
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
  "/",
  asyncHandler(async (request, response) => {
    const goal = await updateUserGoal(request.authUser!.id, request.body);
    response.json(goal);
  }),
);

goalsRouter.delete(
  "/",
  asyncHandler(async (request, response) => {
    await deleteUserGoal(request.authUser!.id);
    response.status(204).send();
  }),
);
