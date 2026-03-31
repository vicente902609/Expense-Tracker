import type { Expense, Goal, GoalProjection } from "@expense-tracker/shared";

import { addDays, differenceInDays, getIsoDate, toMonthKey } from "../../lib/date.js";

type ForecastInputs = {
  goal: Pick<Goal, "targetAmount" | "targetDate" | "savedAmount" | "createdAt" | "targetExpense">;
  expenses: Expense[];
};

type ForecastResult = {
  currentAmount: number;
  status: Goal["status"];
  insightSeed: {
    monthlySavingsRate: number;
    projectedEta: string | null;
    targetDate: string | null;
    suggestedCategoryCut: string | null;
    suggestedCutAmount: number;
    status: Goal["status"];
  };
  projection: GoalProjection;
};

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const getCurrentMonthSpend = (expenses: Expense[]) => {
  const monthKey = toMonthKey(getIsoDate());
  return sum(expenses.filter((expense) => toMonthKey(expense.date) === monthKey).map((expense) => expense.amount));
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
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  return [...totals.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
};

export const computeGoalForecast = ({ goal, expenses }: ForecastInputs): ForecastResult => {
  const currentMonthSpend = getCurrentMonthSpend(expenses);
  const monthlySavingsRate = goal.targetExpense - currentMonthSpend;
  const todayIso = getIsoDate();
  const trackedMonths = getMonthRange(goal.createdAt, todayIso);
  const monthSpend = expenses.reduce<Record<string, number>>((acc, expense) => {
    const monthKey = toMonthKey(expense.date);
    acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount;
    return acc;
  }, {});
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
        suggestedCategoryCut: null,
        suggestedCutAmount: 0,
        status: "achieved",
      },
      projection: {
        monthlySavingsRate,
        projectedEta: todayIso,
        isOnTrack: true,
        shortfallAmount: 0,
        paceWindowDays: 30,
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
        suggestedCategoryCut: getTopCategory(expenses)?.[0] ?? null,
        suggestedCutAmount: 100,
        status: "at_risk",
      },
      projection: {
        monthlySavingsRate,
        projectedEta: null,
        isOnTrack: false,
        shortfallAmount: remainingAmount,
        paceWindowDays: 30,
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
      suggestedCategoryCut: topCategory?.[0] ?? null,
      suggestedCutAmount,
      status: isOnTrack ? "on_track" : "at_risk",
    },
    projection: {
      monthlySavingsRate,
      projectedEta,
      isOnTrack,
      shortfallAmount,
      paceWindowDays: 30,
    },
  };
};
