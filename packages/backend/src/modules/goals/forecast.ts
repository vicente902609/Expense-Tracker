import type { Expense, Goal, GoalProjection } from "@expense-tracker/shared";

import { addDays, differenceInDays, getIsoDate, toMonthKey } from "../../lib/date.js";

type ForecastInputs = {
  goal: Pick<Goal, "targetAmount" | "targetDate" | "savedAmount" | "createdAt" | "targetExpense">;
  expenses: Expense[];
  /** ISO calendar day (YYYY-MM-DD); defaults to today. Used by tests for deterministic output. */
  asOfIsoDate?: string;
};

type ForecastResult = {
  currentAmount: number;
  status: Goal["status"];
  insightSeed: {
    monthlySavingsRate: number;
    projectedEta: string | null;
    targetDate: string | null;
    suggestedCategoryId: string | null;
    suggestedCutAmount: number;
    status: Goal["status"];
  };
  projection: GoalProjection;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const getCurrentMonthSpend = (expenses: Expense[], todayIso: string) => {
  const monthKey = toMonthKey(todayIso);
  return sum(expenses.filter((expense) => toMonthKey(expense.date) === monthKey).map((expense) => expense.amount));
};

/** Sum expense amounts with `date` in [fromIso, toIso] (YYYY-MM-DD lexicographic order). */
const sumExpensesInInclusiveRange = (expenses: Expense[], fromIso: string, toIso: string) =>
  sum(expenses.filter((expense) => expense.date >= fromIso && expense.date <= toIso).map((expense) => expense.amount));

const PACE_LOOKBACK_DAYS = 7;

/**
 * Rolling average daily spend over the last `PACE_LOOKBACK_DAYS` calendar days (including today).
 * If that window has no spend but the month-to-date total is non-zero, fall back to MTD / day-of-month.
 */
const getAvgDailySpendForProjection = (expenses: Expense[], todayIso: string, currentMonthSpend: number) => {
  const fromIso = addDays(todayIso, -(PACE_LOOKBACK_DAYS - 1));
  const sumLastWindow = sumExpensesInInclusiveRange(expenses, fromIso, todayIso);
  let avgDaily = sumLastWindow / PACE_LOOKBACK_DAYS;
  if (avgDaily === 0 && currentMonthSpend > 0) {
    const dayOfMonth = Number(todayIso.slice(8, 10));
    avgDaily = currentMonthSpend / Math.max(1, dayOfMonth);
  }
  return avgDaily;
};

const getRemainingCalendarDaysInMonthAfterToday = (todayIso: string) => {
  const [y, m, d] = todayIso.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return Math.max(0, daysInMonth - d);
};

const getMonthRange = (fromIso: string, toIso: string) => {
  const [fromYear, fromMonth] = fromIso.slice(0, 7).split("-").map(Number);
  const [toYear, toMonth] = toIso.slice(0, 7).split("-").map(Number);
  const out: string[] = [];
  const cursor = new Date(fromYear, fromMonth - 1, 1);
  const end = new Date(toYear, toMonth - 1, 1);
  while (cursor <= end) {
    out.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
};

const getTopCategory = (expenses: Expense[]) => {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(expense.categoryId, (totals.get(expense.categoryId) ?? 0) + expense.amount);
  }

  return [...totals.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
};

/** Last calendar day of the month before `todayIso` (UTC calendar, aligned with `getIsoDate`). */
const lastDayOfPreviousCalendarMonth = (todayIso: string): string => {
  const [y, m] = todayIso.split("-").map(Number);
  const lastPrev = new Date(Date.UTC(y, m - 1, 0));
  return lastPrev.toISOString().slice(0, 10);
};

export const computeGoalForecast = ({ goal, expenses, asOfIsoDate }: ForecastInputs): ForecastResult => {
  const todayIso = asOfIsoDate ?? getIsoDate();
  const currentMonthSpend = getCurrentMonthSpend(expenses, todayIso);
  const avgDailyRecent = getAvgDailySpendForProjection(expenses, todayIso, currentMonthSpend);
  const remainingDaysInMonth = getRemainingCalendarDaysInMonthAfterToday(todayIso);
  const projectedEndOfMonthSpend = currentMonthSpend + avgDailyRecent * remainingDaysInMonth;
  /** Expected surplus vs monthly spending cap at month-end if recent daily pace continues (can be negative). */
  const monthlySavingsRate = goal.targetExpense - projectedEndOfMonthSpend;
  const savingsThroughIso = lastDayOfPreviousCalendarMonth(todayIso);
  const trackedMonths = getMonthRange(goal.createdAt, savingsThroughIso);
  const monthSpend = expenses.reduce<Record<string, number>>((acc, expense) => {
    const monthKey = toMonthKey(expense.date);
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount;
    return acc;
  }, {});
  // Saved progress uses completed calendar months only (not the in-progress current month).
  const trackedSavings = trackedMonths.map((monthKey) => goal.targetExpense - (monthSpend[monthKey] ?? 0));
  const currentAmount = Math.max(Math.max(goal.savedAmount ?? 0, 0) + sum(trackedSavings), 0);
  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0);

  if (remainingAmount === 0) {
    return {
      currentAmount,
      status: "achieved",
      insightSeed: {
        monthlySavingsRate,
        projectedEta: todayIso,
        targetDate: goal.targetDate ?? null,
        suggestedCategoryId: null,
        suggestedCutAmount: 0,
        status: "achieved",
      },
      projection: {
        monthlySavingsRate,
        projectedEta: todayIso,
        isOnTrack: true,
        shortfallAmount: 0,
        paceWindowDays: PACE_LOOKBACK_DAYS,
      },
    };
  }

  if (monthlySavingsRate <= 0) {
    return {
      currentAmount,
      status: "at_risk",
      insightSeed: {
        monthlySavingsRate,
        projectedEta: null,
        targetDate: goal.targetDate ?? null,
        suggestedCategoryId: getTopCategory(expenses)?.[0] ?? null,
        suggestedCutAmount: 100,
        status: "at_risk",
      },
      projection: {
        monthlySavingsRate,
        projectedEta: null,
        isOnTrack: false,
        shortfallAmount: remainingAmount,
        paceWindowDays: PACE_LOOKBACK_DAYS,
      },
    };
  }

  const monthsNeeded = Math.ceil(remainingAmount / monthlySavingsRate);
  const projectedEta = addDays(todayIso, monthsNeeded * 30);
  const isOnTrack = goal.targetDate ? projectedEta <= goal.targetDate : true;
  const topCategory = getTopCategory(expenses);
  const suggestedCutAmount = topCategory ? Math.min(Math.round(topCategory[1] * 0.15), 150) : 0;
  const monthsUntilDeadline = goal.targetDate ? Math.max(differenceInDays(todayIso, goal.targetDate) / 30, 0) : 0;
  const shortfallAmount = goal.targetDate ? (isOnTrack ? 0 : Math.max(remainingAmount - monthlySavingsRate * monthsUntilDeadline, 0)) : 0;

  return {
    currentAmount,
    status: isOnTrack ? "on_track" : "at_risk",
    insightSeed: {
      monthlySavingsRate,
      projectedEta,
      targetDate: goal.targetDate ?? null,
      suggestedCategoryId: topCategory?.[0] ?? null,
      suggestedCutAmount,
      status: isOnTrack ? "on_track" : "at_risk",
    },
    projection: {
      monthlySavingsRate,
      projectedEta,
      isOnTrack,
      shortfallAmount,
      paceWindowDays: PACE_LOOKBACK_DAYS,
    },
  };
};
