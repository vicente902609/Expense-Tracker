import { goalInputSchema } from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { listPredefinedCategoryDocuments } from "../categories/predefined-categories.repository.js";
import { findAllExpensesForUser } from "../expenses/repository.js";
import { getUserCustomCategoryDocs } from "../users/repository.js";
import { buildGoalEtaInsight } from "./insight.js";
import { computeGoalForecast } from "./forecast.js";
import { createGoal, listGoalDocuments, listGoals, updateGoalDetails, updateGoalForecast } from "./repository.js";

const resolveCategoryName = async (userId: string, categoryId: string | null): Promise<string | null> => {
  if (!categoryId) {
    return null;
  }

  const [predefined, custom] = await Promise.all([listPredefinedCategoryDocuments(), getUserCustomCategoryDocs(userId)]);
  const hit = predefined.find((row) => row.categoryId === categoryId) ?? custom.find((row) => row.categoryId === categoryId);
  return hit?.name ?? null;
};

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
  const [goalDocuments, expenses] = await Promise.all([listGoalDocuments(userId), findAllExpensesForUser(userId)]);

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

      const suggestedCategoryCut = await resolveCategoryName(userId, forecast.insightSeed.suggestedCategoryId);

      return updateGoalForecast(goalDocument._id.toHexString(), userId, {
        currentAmount: forecast.currentAmount,
        status: forecast.status,
        aiEtaInsight: buildGoalEtaInsight({
          monthlySavingsRate: forecast.insightSeed.monthlySavingsRate,
          projectedEta: forecast.insightSeed.projectedEta,
          targetDate: forecast.insightSeed.targetDate,
          suggestedCategoryCut,
          suggestedCutAmount: forecast.insightSeed.suggestedCutAmount,
          status: forecast.insightSeed.status,
        }),
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
