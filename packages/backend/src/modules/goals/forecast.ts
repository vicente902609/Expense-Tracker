import type { BudgetPlan, Expense, Goal, GoalProjection } from "@expense-tracker/shared";

import { addDays, differenceInDays, getIsoDate, toMonthKey } from "../../lib/date.js";

type ForecastInputs = {
  goal: Pick<Goal, "targetAmount" | "targetDate">;
  budgetPlan: BudgetPlan | null;
  expenses: Expense[];
};

type ForecastResult = {
  currentAmount: number;
  status: Goal["status"];
  insightSeed: {
    monthlySavingsRate: number;
    projectedEta: string | null;
    targetDate: string;
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

const getTopCategory = (expenses: Expense[]) => {
  const totals = new Map<string, number>();

  for (const expense of expenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  return [...totals.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
};

export const computeGoalForecast = ({ goal, budgetPlan, expenses }: ForecastInputs): ForecastResult => {
  if (!budgetPlan || expenses.length < 3) {
    return {
      currentAmount: 0,
      status: "insufficient_data",
      insightSeed: {
        monthlySavingsRate: 0,
        projectedEta: null,
        targetDate: goal.targetDate,
        suggestedCategoryCut: null,
        suggestedCutAmount: 0,
        status: "insufficient_data",
      },
      projection: {
        monthlySavingsRate: 0,
        projectedEta: null,
        isOnTrack: false,
        shortfallAmount: goal.targetAmount,
        paceWindowDays: 30,
      },
    };
  }

  const currentMonthSpend = getCurrentMonthSpend(expenses);
  const monthlySavingsRate = Math.max(budgetPlan.monthlyIncome - budgetPlan.fixedCosts - currentMonthSpend, 0);
  const currentAmount = Math.max(budgetPlan.savingsTarget, 0);
  const remainingAmount = Math.max(goal.targetAmount - currentAmount, 0);

  if (remainingAmount === 0) {
    return {
      currentAmount,
      status: "achieved",
      insightSeed: {
        monthlySavingsRate,
        projectedEta: getIsoDate(),
        targetDate: goal.targetDate,
        suggestedCategoryCut: null,
        suggestedCutAmount: 0,
        status: "achieved",
      },
      projection: {
        monthlySavingsRate,
        projectedEta: getIsoDate(),
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
        targetDate: goal.targetDate,
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
  const projectedEta = addDays(getIsoDate(), monthsNeeded * 30);
  const isOnTrack = projectedEta <= goal.targetDate;
  const topCategory = getTopCategory(expenses);
  const suggestedCutAmount = topCategory ? Math.min(Math.round(topCategory[1] * 0.15), 150) : 0;
  const monthsUntilDeadline = Math.max(differenceInDays(getIsoDate(), goal.targetDate) / 30, 0);
  const shortfallAmount = isOnTrack ? 0 : Math.max(remainingAmount - monthlySavingsRate * monthsUntilDeadline, 0);

  return {
    currentAmount,
    status: isOnTrack ? "on_track" : "at_risk",
    insightSeed: {
      monthlySavingsRate,
      projectedEta,
      targetDate: goal.targetDate,
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
