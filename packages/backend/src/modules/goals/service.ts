import { goalInputSchema } from "@expense-tracker/shared";

import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { getUserBudgetPlan } from "../budget/service.js";
import { buildEtaInsight } from "../ai/service.js";
import { listExpenses } from "../expenses/repository.js";
import { computeGoalForecast } from "./forecast.js";
import { createGoal, listGoalDocuments, listGoals, updateGoalDetails, updateGoalForecast } from "./repository.js";

const cacheIsFresh = (updatedAt: string) => {
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs < env.FORECAST_CACHE_TTL_MINUTES * 60 * 1000;
};

export const createUserGoal = async (userId: string, payload: unknown) => {
  const input = goalInputSchema.parse(payload);
  const goal = await createGoal(userId, input);
  await recalculateGoalForecasts(userId, {
    force: true,
  });
  return goal;
};

export const updateUserGoal = async (userId: string, goalId: string, payload: unknown) => {
  const input = goalInputSchema.parse(payload);
  const goal = await updateGoalDetails(goalId, userId, input);

  if (!goal) {
    throw new AppError("Goal not found", 404);
  }

  await recalculateGoalForecasts(userId, {
    force: true,
  });

  const goals = await listGoals(userId);
  return goals.find((candidate) => candidate.id === goalId) ?? goal;
};

export const recalculateGoalForecasts = async (userId: string, options: { force: boolean }) => {
  const [goalDocuments, budgetPlan, expenses] = await Promise.all([
    listGoalDocuments(userId),
    getUserBudgetPlan(userId),
    listExpenses(userId, {}),
  ]);

  await Promise.all(
    goalDocuments.map(async (goalDocument) => {
      if (!options.force && cacheIsFresh(goalDocument.forecastUpdatedAt)) {
        return null;
      }

      const forecast = computeGoalForecast({
        goal: {
          targetAmount: goalDocument.targetAmount,
          targetDate: goalDocument.targetDate,
        },
        budgetPlan,
        expenses,
      });

      return updateGoalForecast(goalDocument._id.toHexString(), userId, {
        currentAmount: forecast.currentAmount,
        status: forecast.status,
        aiEtaInsight: await buildEtaInsight(forecast.insightSeed),
        forecast: forecast.projection,
        forecastUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),
  );
};

export const listUserGoals = async (userId: string) => {
  await recalculateGoalForecasts(userId, {
    force: false,
  });

  return listGoals(userId);
};
