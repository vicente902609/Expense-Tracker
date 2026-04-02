import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";

import type { Goal } from "@/types";
import { formatCurrency, getMonthlySpendProgressPercent } from "@/lib/expense-ui";
import { sectionLabelSx } from "@/theme/ui";
import { getGoalCardStatus } from "@/lib/goal-status";
import {
  GoalCardRoot,
  GoalChipRow,
  GoalInsightBox,
  GoalProgressBar,
  GoalStatusChip,
} from "./DashboardGoalCard.styles";

type DashboardGoalCardProps = {
  goal: Goal | undefined;
  monthSpent: number;
  onOpenGoalDialog: () => void;
};

export const DashboardGoalCard = ({ goal, monthSpent, onOpenGoalDialog }: DashboardGoalCardProps) => (
  <>
    <Typography sx={(theme) => ({ ...sectionLabelSx(theme), pt: 0.5 })}>Monthly budget</Typography>

    <GoalCardRoot>
      {goal ? (
        <GoalCardBody goal={goal} monthSpent={monthSpent} onOpenGoalDialog={onOpenGoalDialog} />
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>No monthly target yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Set a name and monthly spending cap. We&apos;ll compare this month&apos;s expenses to that cap and suggest
            where to adjust.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={onOpenGoalDialog}
            sx={{ minHeight: 44, alignSelf: "flex-start" }}
          >
            Set monthly budget
          </Button>
        </Stack>
      )}
    </GoalCardRoot>
  </>
);

type GoalCardBodyProps = {
  goal: Goal;
  monthSpent: number;
  onOpenGoalDialog: () => void;
};

const GoalCardBody = ({ goal, monthSpent, onOpenGoalDialog }: GoalCardBodyProps) => {
  const theme = useTheme();
  const { progress, isOverCap, chipLabel, chipPalette } = getGoalCardStatus(goal, monthSpent);
  const remaining = goal.targetExpense - monthSpent;
  const barValue = getMonthlySpendProgressPercent(monthSpent, goal.targetExpense);

  const paletteColors = theme.palette[chipPalette];

  return (
    <Stack spacing={1.5}>
      <GoalChipRow>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>{goal.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Target {formatCurrency(goal.targetExpense)} this month · spent {formatCurrency(monthSpent)}
          </Typography>
        </Box>
        <GoalStatusChip
          $bgColor={alpha(paletteColors.main, 0.18)}
          $textColor={paletteColors.light}
          $borderColor={alpha(paletteColors.main, 0.35)}
        >
          {chipLabel}
        </GoalStatusChip>
      </GoalChipRow>

      <GoalProgressBar variant="determinate" value={barValue} $barColor={paletteColors.main} />

      <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Typography variant="body2" color="text.secondary">
          {progress}% of cap used
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {remaining >= 0
            ? `${formatCurrency(remaining)} left this month`
            : `${formatCurrency(Math.abs(remaining))} over cap`}
        </Typography>
      </Stack>

      <GoalInsightBox>
        <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
          {goal.insight}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Updated {new Date(goal.insightUpdatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </Typography>
      </GoalInsightBox>

      <Stack direction="row" justifyContent="flex-start" spacing={1.25}>
        <Button color="inherit" onClick={onOpenGoalDialog} sx={{ minHeight: 44 }}>
          Edit budget
        </Button>
        {isOverCap ? (
          <Typography variant="body2" color="error.light" sx={{ alignSelf: "center" }}>
            Trim spending or raise your target in settings.
          </Typography>
        ) : null}
      </Stack>
    </Stack>
  );
};
