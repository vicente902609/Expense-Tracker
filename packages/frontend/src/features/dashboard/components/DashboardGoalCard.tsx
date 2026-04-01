import type { Goal } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";

import { formatCurrency, formatShortDate, getGoalProgress } from "../../../lib/expense-ui.js";
import { RADIUS_CHIP, RADIUS_INNER, sectionLabelSx, surfaceCard } from "../../../theme/ui.js";

import { getGoalCardStatus } from "./goal-card-status.js";

type DashboardGoalCardProps = {
  goal: Goal | undefined;
  onOpenGoalDialog: () => void;
  onCompleteGoal: () => void;
};

export const DashboardGoalCard = ({ goal, onOpenGoalDialog, onCompleteGoal }: DashboardGoalCardProps) => (
  <>
    <Typography sx={(theme) => ({ ...sectionLabelSx(theme), pt: 0.5 })}>Your goal</Typography>

    <Box sx={(theme) => ({ p: { xs: 1.75, sm: 2 }, ...surfaceCard(theme) })}>
      {goal ? (
        <GoalCardBody goal={goal} onOpenGoalDialog={onOpenGoalDialog} onCompleteGoal={onCompleteGoal} />
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>No goal yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Set your monthly target expense and first goal to unlock the ETA forecast card.
          </Typography>
          <Button variant="contained" color="secondary" onClick={onOpenGoalDialog} sx={{ minHeight: 44, alignSelf: "flex-start" }}>
            Set up goal
          </Button>
        </Stack>
      )}
    </Box>
  </>
);

type GoalCardBodyProps = {
  goal: Goal;
  onOpenGoalDialog: () => void;
  onCompleteGoal: () => void;
};

const GoalCardBody = ({ goal, onOpenGoalDialog, onCompleteGoal }: GoalCardBodyProps) => {
  const { progress, isReached, isAlmost, chipLabel, chipPalette } = getGoalCardStatus(goal);
  const paletteKey = chipPalette;

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
            {goal.name} · {formatCurrency(goal.targetAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {goal.targetDate ? `Target ${formatShortDate(goal.targetDate)}` : "No deadline"} · Expense cap {formatCurrency(goal.targetExpense)}/mo
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
        value={getGoalProgress(goal)}
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
          {formatCurrency(goal.currentAmount)} saved
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {progress}% · {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))} to go
        </Typography>
      </Stack>

      <Box sx={(theme) => ({ borderRadius: RADIUS_INNER, p: 1.5, bgcolor: alpha(theme.palette.common.white, 0.04), border: `1px solid ${alpha(theme.palette.common.white, 0.06)}` })}>
        <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
          {isReached
            ? `You hit your goal. Saved an average of ${formatCurrency(goal.forecast.monthlySavingsRate)}/mo. Ready to start your next goal?`
            : isAlmost
              ? `You're ${formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))} away — about one more month at your current pace.`
              : goal.aiEtaInsight}
        </Typography>
      </Box>

      <Stack direction="row" justifyContent="space-between" spacing={1.25}>
        <Button color="inherit" onClick={onOpenGoalDialog} sx={{ minHeight: 44 }}>
          Edit goal
        </Button>
        {isAlmost || isReached ? (
          <Button variant="outlined" color="inherit" onClick={onCompleteGoal} sx={{ minHeight: 44 }}>
            {isReached ? "★ Complete goal" : "Mark as complete"}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
};
