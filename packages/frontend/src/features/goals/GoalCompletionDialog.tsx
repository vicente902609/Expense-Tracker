import { useMemo, useState } from "react";
import type { Goal } from "@expense-tracker/shared";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Radio, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { amountTextFieldProps, formatCurrency } from "@/lib/expense-ui";

type NextGoalChoice = "spent" | "carry" | "partial";

type GoalCompletionDialogProps = {
  goal: Goal;
  open: boolean;
  onClose: () => void;
  onProceed: (payload: { savedAmount: number; subtitle: string }) => void;
};

const monthsSince = (iso: string) => {
  const from = new Date(iso);
  const now = new Date();
  const months = (now.getFullYear() - from.getFullYear()) * 12 + (now.getMonth() - from.getMonth());
  return Math.max(months + 1, 1);
};

export const GoalCompletionDialog = ({ goal, open, onClose, onProceed }: GoalCompletionDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [choice, setChoice] = useState<NextGoalChoice>("spent");
  const [partialAmount, setPartialAmount] = useState("");

  const months = useMemo(() => monthsSince(goal.createdAt), [goal.createdAt]);
  const totalSaved = Math.max(goal.currentAmount, 0);
  const avgSaved = months > 0 ? totalSaved / months : 0;
  const canProceed = choice !== "partial" || (partialAmount.trim() !== "" && Number(partialAmount) >= 0);

  const handleProceed = () => {
    if (choice === "spent") {
      onProceed({ savedAmount: 0, subtitle: "Previous goal archived · savings starting from $0" });
      return;
    }

    if (choice === "carry") {
      const carry = Math.max(goal.targetAmount, 0);
      onProceed({
        savedAmount: carry,
        subtitle: `Previous goal archived · ${formatCurrency(carry)} carried over as head start`,
      });
      return;
    }

    const custom = Math.max(Number(partialAmount) || 0, 0);
    onProceed({
      savedAmount: custom,
      subtitle: `Previous goal archived · ${formatCurrency(custom)} carried over as head start`,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen} scroll="paper">
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            bgcolor: (t) => alpha(t.palette.background.paper, 0.98),
            border: (t) => `1px solid ${alpha(t.palette.common.white, 0.1)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 2.25 } }}>
            <Typography variant="h6">Goal achieved!</Typography>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            <Typography color="text.secondary">You saved {formatCurrency(totalSaved)}. Choose how to proceed to your next goal.</Typography>

            <Box sx={(t) => ({ borderTop: `1px solid ${alpha(t.palette.common.white, 0.08)}`, borderBottom: `1px solid ${alpha(t.palette.common.white, 0.08)}`, py: 1.5 })}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(totalSaved)}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{months} months</Typography>
                <Typography sx={{ fontWeight: 700 }}>{formatCurrency(avgSaved)}/mo</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">total saved</Typography>
                <Typography variant="body2" color="text.secondary">to reach goal</Typography>
                <Typography variant="body2" color="text.secondary">avg saved</Typography>
              </Stack>
            </Box>

            <Stack spacing={1}>
              <Button variant={choice === "spent" ? "contained" : "outlined"} color="inherit" onClick={() => setChoice("spent")} startIcon={<Radio checked={choice === "spent"} />}>
                I spent it — start fresh
              </Button>
              <Button variant={choice === "carry" ? "contained" : "outlined"} color="inherit" onClick={() => setChoice("carry")} startIcon={<Radio checked={choice === "carry"} />}>
                I still have it — carry over
              </Button>
              <Button variant={choice === "partial" ? "contained" : "outlined"} color="inherit" onClick={() => setChoice("partial")} startIcon={<Radio checked={choice === "partial"} />}>
                Partially spent — I&apos;ll enter amount
              </Button>
            </Stack>

            {choice === "partial" ? (
              <TextField
                label="Carry-over amount"
                {...amountTextFieldProps}
                value={partialAmount}
                onChange={(event) => setPartialAmount(event.target.value)}
              />
            ) : null}
            {choice === "partial" && (!partialAmount.trim() || Number(partialAmount) < 0) ? <Alert severity="info">Enter a valid amount to continue.</Alert> : null}

            <Stack direction="row" spacing={1.25}>
              <Button variant="outlined" color="inherit" onClick={onClose} sx={{ minHeight: 48, flex: 1 }}>
                View history
              </Button>
              <Button variant="contained" onClick={handleProceed} disabled={!canProceed} sx={{ minHeight: 48, flex: 2 }}>
                Set up next goal
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
