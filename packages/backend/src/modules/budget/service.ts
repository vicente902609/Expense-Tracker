import { budgetPlanInputSchema } from "@expense-tracker/shared";

import { recalculateGoalForecasts } from "../goals/service.js";
import { getBudgetPlan, upsertBudgetPlan } from "./repository.js";

export const getUserBudgetPlan = async (userId: string) => getBudgetPlan(userId);

export const upsertUserBudgetPlan = async (userId: string, payload: unknown) => {
  const input = budgetPlanInputSchema.parse(payload);
  const budgetPlan = await upsertBudgetPlan(userId, input);

  await recalculateGoalForecasts(userId, {
    force: true,
  });

  return budgetPlan;
};
