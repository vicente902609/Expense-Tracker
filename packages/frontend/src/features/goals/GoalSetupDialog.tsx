import { goalInputSchema, type Goal } from "@expense-tracker/shared";
import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createGoal, updateGoal } from "../../api/goals.js";

type GoalSetupDialogProps = {
  existingGoal?: Goal;
  open: boolean;
  onClose: () => void;
};

export const GoalSetupDialog = ({ existingGoal, open, onClose }: GoalSetupDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    goalName: existingGoal?.name ?? "",
    targetAmount: existingGoal?.targetAmount?.toString() ?? "",
    targetDate: existingGoal?.targetDate ?? "",
  }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = goalInputSchema.safeParse({
        name: form.goalName,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate,
      });

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Check your goal fields.";
        throw new Error(message);
      }

      const payload = parsed.data;

      if (existingGoal) {
        await updateGoal(existingGoal.id, payload);
        return;
      }

      await createGoal(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen} scroll="paper">
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            bgcolor: (t) => alpha(t.palette.background.paper, 0.98),
            border: (t) => `1px solid ${alpha(t.palette.common.white, 0.1)}`,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={(t) => ({
              px: { xs: 2, sm: 3 },
              py: { xs: 2, sm: 2.5 },
              borderBottom: `1px solid ${alpha(t.palette.common.white, 0.08)}`,
            })}
          >
            <Typography variant="h6">{existingGoal ? "Goal details" : "Create goal"}</Typography>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              Name, target amount, and date drive your ETA forecast on the dashboard.
            </Typography>

            <TextField label="Goal name" value={form.goalName} onChange={(event) => setForm((current) => ({ ...current, goalName: event.target.value }))} />
            <TextField label="Target amount" value={form.targetAmount} onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))} />
            <TextField
              label="Target date"
              type="date"
              value={form.targetDate}
              onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))}
              InputLabelProps={{ shrink: true }}
            />

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            <Button
              variant="contained"
              color="primary"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !form.goalName.trim() || !form.targetAmount || !form.targetDate}
              sx={{ minHeight: 48 }}
            >
              {mutation.isPending ? "Saving..." : existingGoal ? "Update goal" : "Create goal"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
