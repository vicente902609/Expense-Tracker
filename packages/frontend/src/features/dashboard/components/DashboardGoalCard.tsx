import type { Goal } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";

import { formatCurrency, getMonthlySpendProgressPercent } from "@/lib/expense-ui";
import { RADIUS_CHIP, RADIUS_INNER, sectionLabelSx, surfaceCard } from "@/theme/ui";

import { getGoalCardStatus } from "@/features/dashboard/components/goal-card-status";

type DashboardGoalCardProps = {
  goal: Goal | undefined;
  /** Month-to-date spending (same basis as “This month” stats). */
  monthSpent: number;
  onOpenGoalDialog: () => void;
};

export const DashboardGoalCard = ({ goal, monthSpent, onOpenGoalDialog }: DashboardGoalCardProps) => (
  <>
    <Typography sx={(theme) => ({ ...sectionLabelSx(theme), pt: 0.5 })}>Monthly budget</Typography>

    <Box sx={(theme) => ({ p: { xs: 1.75, sm: 2 }, ...surfaceCard(theme) })}>
      {goal ? (
        <GoalCardBody goal={goal} monthSpent={monthSpent} onOpenGoalDialog={onOpenGoalDialog} />
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>No monthly target yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Set a name and monthly spending cap. We&apos;ll compare this month&apos;s expenses to that cap and suggest where to adjust.
          </Typography>
          <Button variant="contained" color="secondary" onClick={onOpenGoalDialog} sx={{ minHeight: 44, alignSelf: "flex-start" }}>
            Set monthly budget
          </Button>
        </Stack>
      )}
    </Box>
  </>
);

type GoalCardBodyProps = {
  goal: Goal;
  monthSpent: number;
  onOpenGoalDialog: () => void;
};

const GoalCardBody = ({ goal, monthSpent, onOpenGoalDialog }: GoalCardBodyProps) => {
  const { progress, isOverCap, chipLabel, chipPalette } = getGoalCardStatus(goal, monthSpent);
  const paletteKey = chipPalette;
  const remaining = goal.targetExpense - monthSpent;
  const barValue = getMonthlySpendProgressPercent(monthSpent, goal.targetExpense);

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>{goal.name}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Target {formatCurrency(goal.targetExpense)} this month · spent {formatCurrency(monthSpent)}
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            alignSelf: { xs: "flex-start", sm: "center" },
            px: 1.25,
            py: 0.5,
            borderRadius: RADIUS_CHIP,
            bgcolor: alpha(theme.palette[paletteKey].main, 0.18),
            color: theme.palette[paletteKey].light,
            fontSize: 12,
            fontWeight: 700,
            border: `1px solid ${alpha(theme.palette[paletteKey].main, 0.35)}`,
            whiteSpace: "nowrap",
          })}
        >
          {chipLabel}
        </Box>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={barValue}
        sx={(theme) => ({
          height: 10,
          borderRadius: "5px",
          bgcolor: alpha(theme.palette.common.white, 0.08),
          "& .MuiLinearProgress-bar": {
            borderRadius: "5px",
            bgcolor: theme.palette[paletteKey].main,
          },
        })}
      />

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

      <Box sx={(theme) => ({ borderRadius: RADIUS_INNER, p: 1.5, bgcolor: alpha(theme.palette.common.white, 0.04), border: `1px solid ${alpha(theme.palette.common.white, 0.06)}` })}>
        <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
          {goal.insight}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
          Updated {new Date(goal.insightUpdatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </Typography>
      </Box>

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
