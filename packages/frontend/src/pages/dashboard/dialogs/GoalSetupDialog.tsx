import { useState } from "react";
import { Alert, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { goalCreateBodySchema, goalUpdateBodySchema, type Goal } from "@/types";
import { createGoal, deleteGoal, updateGoal } from "@/api/goals";
import { amountTextFieldProps } from "@/lib/expense-ui";
import { DialogBody, DialogHeader } from "./GoalSetupDialog.styles";

type GoalSetupDialogProps = {
  existingGoal?: Goal;
  open: boolean;
  onClose: () => void;
  initialValues?: Partial<{ name: string; targetExpense: number }>;
  title?: string;
  subtitle?: string;
  submitLabel?: string;
};

export const GoalSetupDialog = ({
  existingGoal,
  open,
  onClose,
  initialValues,
  title,
  subtitle,
  submitLabel,
}: GoalSetupDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    goalName: existingGoal?.name ?? initialValues?.name ?? "",
    targetExpense:
      existingGoal?.targetExpense?.toString() ??
      (initialValues?.targetExpense != null ? String(initialValues.targetExpense) : ""),
  }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (existingGoal) {
        const parsed = goalUpdateBodySchema.safeParse({
          name: form.goalName.trim(),
          targetExpense: Number(form.targetExpense),
        });
        if (!parsed.success) {
          const message = parsed.error.issues[0]?.message ?? "Check your goal fields.";
          throw new Error(message);
        }
        await updateGoal(parsed.data);
        return;
      }

      const parsed = goalCreateBodySchema.safeParse({
        name: form.goalName.trim(),
        targetExpense: Number(form.targetExpense),
      });
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Check your goal fields.";
        throw new Error(message);
      }
      await createGoal(parsed.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGoal(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
      onClose();
    },
  });

  const handleDelete = () => {
    if (!existingGoal) {
      return;
    }
    if (!window.confirm("Remove your monthly budget? You can set a new one anytime.")) {
      return;
    }
    deleteMutation.mutate();
  };

  const canSubmit =
    form.goalName.trim().length > 0 &&
    form.targetExpense.trim() !== "" &&
    Number(form.targetExpense) > 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" fullScreen={fullScreen} scroll="paper">
      <DialogContent sx={{ p: 0 }}>
        <DialogBody>
          <DialogHeader>
            <Typography variant="h6">
              {title ?? (existingGoal ? "Edit monthly budget" : "Monthly budget")}
            </Typography>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </DialogHeader>

          <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: -0.5 }}>
                {subtitle}
              </Typography>
            ) : null}
            <TextField
              label="Name"
              value={form.goalName}
              onChange={(event) => setForm((current) => ({ ...current, goalName: event.target.value }))}
            />

            <TextField
              label="Monthly spending target"
              {...amountTextFieldProps}
              inputProps={{ ...amountTextFieldProps.inputProps, min: 0.01, step: 0.01 }}
              value={form.targetExpense}
              onChange={(event) => setForm((current) => ({ ...current, targetExpense: event.target.value }))}
              helperText="We compare this to your expenses in the current calendar month and refresh tips when spending changes."
            />

            {saveMutation.error ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}
            {deleteMutation.error ? <Alert severity="error">{deleteMutation.error.message}</Alert> : null}

            <Stack direction="row" spacing={1.25}>
              {existingGoal ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending || saveMutation.isPending}
                  sx={{ minHeight: 48, flex: 1 }}
                >
                  {deleteMutation.isPending ? "Removing…" : "Remove"}
                </Button>
              ) : (
                <Button variant="outlined" color="inherit" onClick={onClose} sx={{ minHeight: 48, flex: 1 }}>
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || deleteMutation.isPending || !canSubmit}
                sx={{ minHeight: 48, flex: 2 }}
              >
                {saveMutation.isPending ? "Saving…" : submitLabel ?? (existingGoal ? "Save" : "Create")}
              </Button>
            </Stack>
          </Stack>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};
