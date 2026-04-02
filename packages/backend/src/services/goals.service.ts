import {
  listCustomCategoriesByUser,
  listPredefinedCategories,
} from '../repositories/category.repository';
import {
  createGoal as createGoalInDb,
  deleteGoal as deleteGoalInDb,
  getGoal as getGoalInDb,
  updateGoalAttributes,
  updateGoalInsight,
} from '../repositories/goal.repository';
import { listExpensesByMonth } from '../repositories/expense.repository';
import { buildInsightExpenseOptions, callOpenAI } from '../lib/openai';
import type { InsightExpenseModel, InsightExpensePrompt } from '../lib/openai';
import type { Goal, GoalItem } from '../models/goal';
import { toGoal } from '../models/goal';

// ─── Month helpers ────────────────────────────────────────────────────────────

const getMonthKeys = (now = new Date()): { current: string; prev: string } => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const current = `${year}-${String(month).padStart(2, '0')}`;
  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prev = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, '0')}`;
  return { current, prev };
};

const getTotalDaysInMonth = (now = new Date()): number => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};

const getDaysRemainingInMonth = (now = new Date()): number => {
  return Math.max(0, getTotalDaysInMonth(now) - now.getUTCDate());
};

// ─── Insight builder ──────────────────────────────────────────────────────────

const fmt = (n: number): string => {
  const fixed = n.toFixed(2);
  return fixed.endsWith('.00') ? String(Math.round(n)) : fixed;
};

/**
 * Builds a fallback insight string using rule-based logic when OpenAI is unavailable.
 */
const buildFallbackInsight = (
  targetExpense: number,
  currentTotal: number,
  totalDays: number,
  daysRemaining: number,
  topCatName: string,
): string => {
  if (currentTotal > targetExpense) {
    return `You're over budget by $${fmt(currentTotal - targetExpense)}. Consider reducing ${topCatName} expenses to stay within your $${fmt(targetExpense)} target.`;
  }
  const daysElapsed = Math.max(1, totalDays - daysRemaining);
  const avgDailySpend = currentTotal / daysElapsed;
  const allowedDailySpend = targetExpense / totalDays;
  if (avgDailySpend > allowedDailySpend) {
    const projectedTotal = avgDailySpend * totalDays;
    const dailyLimit = daysRemaining > 0 ? fmt((targetExpense - currentTotal) / daysRemaining) : '0';
    return `⚠️ You're spending $${fmt(avgDailySpend)}/day on average — above your $${fmt(allowedDailySpend)}/day target (projected: $${fmt(projectedTotal)}). Reduce ${topCatName} and keep daily spend under $${dailyLimit} to finish on budget.`;
  }
  if (currentTotal > targetExpense * 0.9) {
    return `Heads up — you've used $${fmt(currentTotal)} of your $${fmt(targetExpense)} monthly target with ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} remaining. Watch your ${topCatName} spending.`;
  }
  return `You're on track! Current spend ($${fmt(currentTotal)}) is within your $${fmt(targetExpense)} target.`;
};

// ─── Insight recalculation ────────────────────────────────────────────────────

/**
 * Recomputes the insight string via OpenAI (falls back to rule-based string when
 * OPENAI_API_KEY / OPENAI_MODEL env vars are absent) and writes it back to the
 * Goal item. No-op if the user has no goal.
 * Called after any expense mutation (create / update / delete).
 */
export const recalculateGoalInsight = async (userId: string): Promise<void> => {
  const goal = await getGoalInDb(userId);
  if (!goal) return;

  const { current, prev } = getMonthKeys();

  const [currentExpenses, prevExpenses, predefinedCats, customCats] = await Promise.all([
    listExpensesByMonth(userId, current),
    listExpensesByMonth(userId, prev),
    listPredefinedCategories(),
    listCustomCategoriesByUser(userId),
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
  const totalDaysInMonth = getTotalDaysInMonth();
  const daysRemaining = getDaysRemainingInMonth();

  // Determine top category name for fallback
  let topCatName = 'Other';
  let topAmount = -Infinity;
  for (const [catId, amt] of currentByCategory) {
    if (amt > topAmount) {
      topAmount = amt;
      topCatName = categoryNameMap.get(catId) ?? 'Other';
    }
  }

  const promptData: InsightExpensePrompt = {
    targetExpense: goal.targetExpense,
    currentMonthTotal,
    prevMonthTotal,
    totalDaysInMonth,
    daysRemainingInMonth: daysRemaining,
    categories: [...currentByCategory.entries()].map(([catId, currentAmount]) => ({
      name: categoryNameMap.get(catId) ?? 'Other',
      currentAmount,
      prevAmount: prevByCategory.get(catId) ?? 0,
    })),
  };

  const apiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
  const model = process.env.OPENAI_MODEL?.trim() ?? '';

  let insight: string;

  if (!apiKey || !model) {
    insight = buildFallbackInsight(goal.targetExpense, currentMonthTotal, totalDaysInMonth, daysRemaining, topCatName);
  } else {
    try {
      const result = await callOpenAI<InsightExpenseModel>(
        buildInsightExpenseOptions(promptData, apiKey, model),
      );
      insight = result?.insight?.trim() ||
        buildFallbackInsight(goal.targetExpense, currentMonthTotal, totalDaysInMonth, daysRemaining, topCatName);
    } catch {
      insight = buildFallbackInsight(goal.targetExpense, currentMonthTotal, totalDaysInMonth, daysRemaining, topCatName);
    }
  }

  await updateGoalInsight(userId, insight, new Date().toISOString());
};

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const getGoalForUser = async (userId: string): Promise<Goal | null> => {
  const item = await getGoalInDb(userId);
  return item ? toGoal(item) : null;
};

export const createGoalForUser = async (
  userId: string,
  input: { name: string; targetExpense: number },
): Promise<{ goal: Goal; alreadyExists: boolean }> => {
  const existing = await getGoalInDb(userId);
  if (existing) return { goal: toGoal(existing), alreadyExists: true };

  const now = new Date().toISOString();
  const item: GoalItem = {
    PK: `USER#${userId}`,
    SK: 'GOAL',
    name: input.name,
    targetExpense: input.targetExpense,
    insight: 'Calculating…',
    insightUpdatedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  await createGoalInDb(item);
  await recalculateGoalInsight(userId);

  // Return item with the freshly computed insight
  const fresh = await getGoalInDb(userId);
  return { goal: toGoal(fresh ?? item), alreadyExists: false };
};

export const updateGoalForUser = async (
  userId: string,
  input: { name?: string; targetExpense?: number },
): Promise<Goal | null> => {
  const existing = await getGoalInDb(userId);
  if (!existing) return null;

  const updated = await updateGoalAttributes(userId, {
    name: input.name ?? existing.name,
    targetExpense: input.targetExpense ?? existing.targetExpense,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) return null;

  await recalculateGoalInsight(userId);

  const fresh = await getGoalInDb(userId);
  return toGoal(fresh ?? updated);
};

export const deleteGoalForUser = async (userId: string): Promise<boolean> => {
  return deleteGoalInDb(userId);
};
