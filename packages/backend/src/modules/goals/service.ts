import { goalCreateBodySchema, goalUpdateBodySchema } from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { findExpensesInMonth } from "../expenses/repository.js";
import { listPredefinedCategoryDocuments } from "../categories/predefined-categories.repository.js";
import { getUserCustomCategoryDocs } from "../users/repository.js";
import type { InsightExpensePrompt } from "./insight-expense-openai.js";
import { fetchExpenseInsightFromModel } from "./insight-expense-openai.js";
import {
  countGoalsForUser,
  deleteGoalsForUser,
  getGoalForUser,
  insertGoal,
  updateGoalFieldsForUser,
  updateGoalInsightForUser,
} from "./repository.js";

const getMonthKeys = (now = new Date()): { current: string; prev: string } => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const current = `${year}-${String(month).padStart(2, "0")}`;
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prev = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
  return { current, prev };
};

const getDaysRemainingInMonth = (now = new Date()): number => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Math.max(0, daysInMonth - now.getUTCDate());
};

const fmt = (n: number): string => {
  const fixed = n.toFixed(2);
  return fixed.endsWith(".00") ? String(Math.round(n)) : fixed;
};

const buildFallbackInsight = (
  targetExpense: number,
  currentTotal: number,
  daysRemaining: number,
  topCatName: string,
): string => {
  if (currentTotal > targetExpense) {
    return `You're over budget by $${fmt(currentTotal - targetExpense)}. Consider reducing ${topCatName} expenses to stay within your $${fmt(targetExpense)} target.`;
  }
  if (currentTotal > targetExpense * 0.9) {
    return `Heads up — you've used $${fmt(currentTotal)} of your $${fmt(targetExpense)} monthly target with ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remaining. Watch your ${topCatName} spending.`;
  }
  return `You're on track! Current spend ($${fmt(currentTotal)}) is within your $${fmt(targetExpense)} target.`;
};

/**
 * Recomputes the monthly spending insight (OpenAI when configured, else rule-based).
 * No-op if the user has no goal.
 */
export const recalculateGoalInsight = async (userId: string): Promise<void> => {
  const goal = await getGoalForUser(userId);
  if (!goal) {
    return;
  }

  const { current, prev } = getMonthKeys();

  const [currentExpenses, prevExpenses, predefinedCats, customCats] = await Promise.all([
    findExpensesInMonth(userId, current),
    findExpensesInMonth(userId, prev),
    listPredefinedCategoryDocuments(),
    getUserCustomCategoryDocs(userId),
  ]);

  const categoryNameMap = new Map<string, string>();
  for (const cat of [...predefinedCats, ...customCats]) {
    categoryNameMap.set(cat.categoryId, cat.name);
  }

  const currentByCategory = new Map<string, number>();
  for (const e of currentExpenses) {
    currentByCategory.set(e.categoryId, (currentByCategory.get(e.categoryId) ?? 0) + e.amount);
  }

  const prevByCategory = new Map<string, number>();
  for (const e of prevExpenses) {
    prevByCategory.set(e.categoryId, (prevByCategory.get(e.categoryId) ?? 0) + e.amount);
  }

  const currentMonthTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const prevMonthTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
  const daysRemaining = getDaysRemainingInMonth();

  let topCatName = "Other";
  let topAmount = -Infinity;
  for (const [catId, amt] of currentByCategory) {
    if (amt > topAmount) {
      topAmount = amt;
      topCatName = categoryNameMap.get(catId) ?? "Other";
    }
  }

  const promptData: InsightExpensePrompt = {
    targetExpense: goal.targetExpense,
    currentMonthTotal,
    prevMonthTotal,
    daysRemainingInMonth: daysRemaining,
    categories: [...currentByCategory.entries()].map(([catId, currentAmount]) => ({
      name: categoryNameMap.get(catId) ?? "Other",
      currentAmount,
      prevAmount: prevByCategory.get(catId) ?? 0,
    })),
  };

  const modelResult = await fetchExpenseInsightFromModel(promptData);
  const trimmed = modelResult?.insight?.trim();
  const insight =
    trimmed ||
    buildFallbackInsight(goal.targetExpense, currentMonthTotal, daysRemaining, topCatName);

  const insightUpdatedAt = new Date().toISOString();
  await updateGoalInsightForUser(userId, insight, insightUpdatedAt);
};

export const getUserGoal = getGoalForUser;

export const createUserGoal = async (userId: string, payload: unknown) => {
  const input = goalCreateBodySchema.parse(payload);
  const n = await countGoalsForUser(userId);
  if (n > 0) {
    throw new AppError("A goal already exists for this user. Use PUT /goals to update it.", 409);
  }
  await insertGoal(userId, input);
  await recalculateGoalInsight(userId);
  const goal = await getGoalForUser(userId);
  if (!goal) {
    throw new AppError("Failed to create goal", 500);
  }
  return goal;
};

export const updateUserGoal = async (userId: string, payload: unknown) => {
  const input = goalUpdateBodySchema.parse(payload);
  const updated = await updateGoalFieldsForUser(userId, input);
  if (!updated) {
    throw new AppError("Goal not found", 404);
  }
  await recalculateGoalInsight(userId);
  const goal = await getGoalForUser(userId);
  if (!goal) {
    throw new AppError("Goal not found", 404);
  }
  return goal;
};

export const deleteUserGoal = async (userId: string) => {
  const deleted = await deleteGoalsForUser(userId);
  if (!deleted) {
    throw new AppError("Goal not found", 404);
  }
};
