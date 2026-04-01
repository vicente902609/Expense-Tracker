import { goalInputSchema, type Goal } from "@expense-tracker/shared";
import { useState } from "react";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createGoal, updateGoal } from "@/api/goals";
import { amountTextFieldProps } from "@/lib/expense-ui";

type GoalSetupDialogProps = {
  existingGoal?: Goal;
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<{
    name: string;
    targetAmount: number;
    targetDate: string;
    savedAmount: number;
    targetExpense: number;
  }>;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
};

export const GoalSetupDialog = ({ existingGoal, open, onClose, initialValues, title, subtitle, submitLabel }: GoalSetupDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    goalName: existingGoal?.name ?? initialValues?.name ?? "",
    targetAmount: existingGoal?.targetAmount?.toString() ?? (initialValues?.targetAmount != null ? String(initialValues.targetAmount) : ""),
    targetDate: existingGoal?.targetDate ?? initialValues?.targetDate ?? "",
    savedAmount: existingGoal?.savedAmount?.toString() ?? (initialValues?.savedAmount != null ? String(initialValues.savedAmount) : ""),
    targetExpense: existingGoal?.targetExpense?.toString() ?? (initialValues?.targetExpense != null ? String(initialValues.targetExpense) : ""),
  }));

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = goalInputSchema.safeParse({
        name: form.goalName,
        targetAmount: Number(form.targetAmount),
        targetDate: form.targetDate || undefined,
        savedAmount: form.savedAmount ? Number(form.savedAmount) : undefined,
        targetExpense: Number(form.targetExpense),
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
            <Typography variant="h6">{title ?? (existingGoal ? "Edit goal" : "Create goal")}</Typography>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
            <TextField label="Goal name" value={form.goalName} onChange={(event) => setForm((current) => ({ ...current, goalName: event.target.value }))} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <TextField
                label="Target amount"
                {...amountTextFieldProps}
                value={form.targetAmount}
                onChange={(event) => setForm((current) => ({ ...current, targetAmount: event.target.value }))}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Deadline"
                type="date"
                value={form.targetDate}
                onChange={(event) => setForm((current) => ({ ...current, targetDate: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
            </Stack>

            <TextField
              label="Monthly spending target"
              {...amountTextFieldProps}
              value={form.targetExpense}
              onChange={(event) => setForm((current) => ({ ...current, targetExpense: event.target.value }))}
              helperText="Anything you spend under this each month counts as savings toward your goal."
            />
            <TextField
              label="Already saved (optional)"
              {...amountTextFieldProps}
              value={form.savedAmount}
              onChange={(event) => setForm((current) => ({ ...current, savedAmount: event.target.value }))}
            />

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            <Stack direction="row" spacing={1.25}>
              <Button variant="outlined" color="inherit" onClick={onClose} sx={{ minHeight: 48, flex: 1 }}>
                {existingGoal ? "Delete goal" : "Cancel"}
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !form.goalName.trim() || !form.targetAmount || !form.targetExpense}
                sx={{ minHeight: 48, flex: 2 }}
              >
                {mutation.isPending ? "Saving..." : submitLabel ?? (existingGoal ? "Save changes" : "Create goal")}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
