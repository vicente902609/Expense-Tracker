import type { BudgetPlan, Goal } from "@expense-tracker/shared";
import { useEffect, useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createGoal, updateGoal } from "../../api/goals.js";

type GoalSetupDialogProps = {
  existingGoal?: Goal;
  open: boolean;
  onClose: () => void;
};

export const GoalSetupDialog = ({ existingGoal, open, onClose }: GoalSetupDialogProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    goalName: "",
    targetAmount: "",
    targetDate: "",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      goalName: existingGoal?.name ?? "",
      targetAmount: existingGoal?.targetAmount?.toString() ?? "",
      targetDate: existingGoal?.targetDate ?? "",
    });
  }, [existingGoal, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.goalName,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate,
      };

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
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ bgcolor: "rgba(56,56,53,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography variant="h6">{existingGoal ? "Goal Details" : "Create Goal"}</Typography>
            <IconButton onClick={onClose} color="inherit">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              Create or update the goal name, target amount, and target date that drive your ETA forecast.
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

            <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : existingGoal ? "Update goal" : "Create goal"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
