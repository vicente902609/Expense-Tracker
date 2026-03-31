import { goalInputSchema } from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { buildGoalEtaInsight } from "./insight.js";
import { listExpenses } from "../expenses/repository.js";
import { computeGoalForecast } from "./forecast.js";
import { createGoal, listGoalDocuments, listGoals, updateGoalDetails, updateGoalForecast } from "./repository.js";

export const createUserGoal = async (userId: string, payload: unknown) => {
  const input = goalInputSchema.parse(payload);
  const goal = await createGoal(userId, input);
  await recalculateGoalForecasts(userId);
  return goal;
};

export const updateUserGoal = async (userId: string, goalId: string, payload: unknown) => {
  const input = goalInputSchema.parse(payload);
  const goal = await updateGoalDetails(goalId, userId, input);

  if (!goal) {
    throw new AppError("Goal not found", 404);
  }

  await recalculateGoalForecasts(userId);

  const goals = await listGoals(userId);
  return goals.find((candidate) => candidate.id === goalId) ?? goal;
};

export const recalculateGoalForecasts = async (userId: string) => {
  const [goalDocuments, expenses] = await Promise.all([
    listGoalDocuments(userId),
    listExpenses(userId, {}),
  ]);

  await Promise.all(
    goalDocuments.map(async (goalDocument) => {
      const forecast = computeGoalForecast({
        goal: {
          targetAmount: goalDocument.targetAmount,
          targetDate: goalDocument.targetDate,
          savedAmount: goalDocument.savedAmount,
          createdAt: goalDocument.createdAt,
          targetExpense: goalDocument.targetExpense,
        },
        expenses,
      });

      return updateGoalForecast(goalDocument._id.toHexString(), userId, {
        currentAmount: forecast.currentAmount,
        status: forecast.status,
        aiEtaInsight: buildGoalEtaInsight(forecast.insightSeed),
        forecast: forecast.projection,
        forecastUpdatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }),
  );
};

export const listUserGoals = async (userId: string) => {
  await recalculateGoalForecasts(userId);

  return listGoals(userId);
};
