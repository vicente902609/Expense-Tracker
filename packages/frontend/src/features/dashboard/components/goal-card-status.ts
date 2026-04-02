import type { Goal } from "@expense-tracker/shared";

import { getMonthlySpendProgressPercent } from "@/lib/expense-ui";

export type GoalChipPalette = "success" | "warning" | "error";

export type GoalCardStatus = {
  progress: number;
  isOverCap: boolean;
  isNearCap: boolean;
  chipLabel: string;
  chipPalette: GoalChipPalette;
};

export const getGoalCardStatus = (goal: Goal, monthSpent: number): GoalCardStatus => {
  const cap = goal.targetExpense;
  const progress = Math.round(getMonthlySpendProgressPercent(monthSpent, cap));
  const isOverCap = monthSpent > cap;
  const isNearCap = !isOverCap && monthSpent > cap * 0.9;

  const chipLabel = isOverCap ? "Over monthly target" : isNearCap ? "Close to cap" : "On track";

  const chipPalette: GoalChipPalette = isOverCap ? "error" : isNearCap ? "warning" : "success";

  return { progress, isOverCap, isNearCap, chipLabel, chipPalette };
};
