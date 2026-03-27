import type { Goal } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";

import { formatCurrency, formatShortDate, getGoalProgress } from "../../../lib/expense-ui.js";
import { RADIUS_CHIP, RADIUS_INNER, sectionLabelSx, surfaceCard } from "../../../theme/ui.js";

type DashboardGoalCardProps = {
  goal: Goal | undefined;
  onOpenGoalDialog: () => void;
};

export const DashboardGoalCard = ({ goal, onOpenGoalDialog }: DashboardGoalCardProps) => (
  <>
    <Typography sx={(theme) => ({ ...sectionLabelSx(theme), pt: 0.5 })}>Your goal</Typography>

    <Box sx={(theme) => ({ p: { xs: 1.75, sm: 2 }, ...surfaceCard(theme) })}>
      {goal ? (
        <Stack spacing={1.5}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>
                {goal.name} · {formatCurrency(goal.targetAmount)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Target {formatShortDate(goal.targetDate)}
              </Typography>
            </Box>
            <Box
              sx={(theme) => ({
                alignSelf: { xs: "flex-start", sm: "center" },
                px: 1.25,
                py: 0.5,
                borderRadius: RADIUS_CHIP,
                bgcolor: alpha(theme.palette.secondary.main, 0.18),
                color: "secondary.light",
                fontSize: 12,
                fontWeight: 700,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.35)}`,
                whiteSpace: "nowrap",
              })}
            >
              {goal.forecast.projectedEta ? `${formatShortDate(goal.forecast.projectedEta)}${goal.status === "at_risk" ? " · late" : ""}` : "Needs data"}
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
                bgcolor: theme.palette.secondary.main,
              },
            })}
          />

          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(goal.currentAmount)} saved
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getGoalProgress(goal))}% · {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))} to go
            </Typography>
          </Stack>

          <Box sx={(theme) => ({ borderRadius: RADIUS_INNER, p: 1.5, bgcolor: alpha(theme.palette.common.white, 0.04), border: `1px solid ${alpha(theme.palette.common.white, 0.06)}` })}>
            <Typography variant="body2" sx={{ lineHeight: 1.55 }}>
              {goal.aiEtaInsight}
            </Typography>
          </Box>

          <Button color="inherit" onClick={onOpenGoalDialog} sx={{ minHeight: 44, alignSelf: "flex-start" }}>
            Update goal inputs
          </Button>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          <Typography sx={{ fontWeight: 700 }}>No goal yet</Typography>
          <Typography color="text.secondary" variant="body2">
            Add your budget and first savings goal to unlock the ETA forecast card.
          </Typography>
          <Button variant="contained" color="secondary" onClick={onOpenGoalDialog} sx={{ minHeight: 44, alignSelf: "flex-start" }}>
            Set up goal
          </Button>
        </Stack>
      )}
    </Box>
  </>
);
