import type { Goal } from "@expense-tracker/shared";

import { formatShortDate, getGoalProgress } from "../../../lib/expense-ui.js";

export type GoalChipPalette = "success" | "warning" | "secondary";

export type GoalCardStatus = {
  progress: number;
  isReached: boolean;
  isAlmost: boolean;
  chipLabel: string;
  chipPalette: GoalChipPalette;
};

export const getGoalCardStatus = (goal: Goal): GoalCardStatus => {
  const progress = Math.round(getGoalProgress(goal));
  const isReached = progress >= 100;
  const isAlmost = progress >= 90 && progress < 100;
  const isOverTargetNoEta = !goal.forecast.projectedEta && (goal.status === "at_risk" || !goal.forecast.isOnTrack);

  const chipLabel = isReached
    ? "★ Target reached"
    : isAlmost
      ? "Almost there"
      : goal.forecast.projectedEta
        ? `On track · Est. ${formatShortDate(goal.forecast.projectedEta)}`
        : isOverTargetNoEta
          ? "Off track · above target spend"
          : "Needs data";

  const chipPalette: GoalChipPalette = isReached ? "success" : isAlmost ? "warning" : "secondary";

  return { progress, isReached, isAlmost, chipLabel, chipPalette };
};
