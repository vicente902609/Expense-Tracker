import { Router } from "express";

import { asyncHandler } from "../../lib/http.js";
import { getUserBudgetPlan, upsertUserBudgetPlan } from "./service.js";

export const budgetRouter = Router();

budgetRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const budgetPlan = await getUserBudgetPlan(request.authUser!.id);
    response.json(budgetPlan);
  }),
);

budgetRouter.put(
  "/",
  asyncHandler(async (request, response) => {
    const budgetPlan = await upsertUserBudgetPlan(request.authUser!.id, request.body);
    response.json(budgetPlan);
  }),
);
