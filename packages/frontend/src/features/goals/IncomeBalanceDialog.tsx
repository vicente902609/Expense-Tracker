import { useEffect, useState } from "react";
import type { BudgetPlan } from "@expense-tracker/shared";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertBudgetPlan } from "../../api/goals.js";
import { formatCurrency } from "../../lib/expense-ui.js";

type IncomeBalanceDialogProps = {
  budgetPlan: BudgetPlan | null | undefined;
  open: boolean;
  onClose: () => void;
};

export const IncomeBalanceDialog = ({ budgetPlan, open, onClose }: IncomeBalanceDialogProps) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    monthlyIncome: "0",
    savingsTarget: "0",
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      monthlyIncome: budgetPlan?.monthlyIncome?.toString() ?? "0",
      savingsTarget: budgetPlan?.savingsTarget?.toString() ?? "0",
    });
  }, [budgetPlan, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      const monthlyIncome = Number(form.monthlyIncome);

      await upsertBudgetPlan({
        monthlyIncome,
        fixedCosts: budgetPlan?.fixedCosts ?? 0,
        savingsTarget: Number(form.savingsTarget),
        incomeSources: {
          salary: monthlyIncome,
          freelance: 0,
          businessRevenue: 0,
          passiveIncome: 0,
        },
        plannedExpenses: budgetPlan?.plannedExpenses ?? {
          food: 0,
          rent: 0,
          transport: 0,
          subscriptions: 0,
          shopping: 0,
        },
        categoryLimits: budgetPlan?.categoryLimits ?? {},
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["budget-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
      ]);
      onClose();
    },
  });

  const monthlyIncome = Number(form.monthlyIncome || 0);
  const currentBalance = Number(form.savingsTarget || 0);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ bgcolor: "rgba(56,56,53,0.98)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.25, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography variant="h6">Income & Balance</Typography>
            <IconButton onClick={onClose} color="inherit">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ p: 3 }}>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              Set your monthly income and current saved balance. The app calculates the rest from your actual expenses.
            </Typography>

            <TextField label="Monthly income" value={form.monthlyIncome} onChange={(event) => setForm((current) => ({ ...current, monthlyIncome: event.target.value }))} />
            <TextField label="Current saved amount" value={form.savingsTarget} onChange={(event) => setForm((current) => ({ ...current, savingsTarget: event.target.value }))} />

            <Box sx={{ borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.05)", p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Monthly income</Typography>
                <Typography fontWeight={700}>{formatCurrency(monthlyIncome)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Current balance</Typography>
                <Typography fontWeight={700}>{formatCurrency(currentBalance)}</Typography>
              </Stack>
            </Box>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Update income"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
