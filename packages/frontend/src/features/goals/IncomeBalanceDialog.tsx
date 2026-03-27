import { useState } from "react";
import type { BudgetPlan } from "@expense-tracker/shared";
import { Alert, Box, Button, Dialog, DialogContent, IconButton, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { upsertBudgetPlan } from "../../api/goals.js";
import { formatCurrency } from "../../lib/expense-ui.js";
import { radiusInner } from "../../theme/ui.js";

type IncomeBalanceDialogProps = {
  budgetPlan: BudgetPlan | null | undefined;
  open: boolean;
  onClose: () => void;
};

export const IncomeBalanceDialog = ({ budgetPlan, open, onClose }: IncomeBalanceDialogProps) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    monthlyIncome: budgetPlan?.monthlyIncome?.toString() ?? "0",
    savingsTarget: budgetPlan?.savingsTarget?.toString() ?? "0",
  }));

  const mutation = useMutation({
    mutationFn: async () => {
      const monthlyIncome = Number(form.monthlyIncome);
      const savingsTarget = Number(form.savingsTarget);

      if (!Number.isFinite(monthlyIncome) || monthlyIncome < 0) {
        throw new Error("Monthly income must be a valid number (0 or more).");
      }

      if (!Number.isFinite(savingsTarget) || savingsTarget < 0) {
        throw new Error("Current saved amount must be a valid number (0 or more).");
      }

      await upsertBudgetPlan({
        monthlyIncome,
        fixedCosts: budgetPlan?.fixedCosts ?? 0,
        savingsTarget,
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
              py: { xs: 2, sm: 2.25 },
              borderBottom: `1px solid ${alpha(t.palette.common.white, 0.08)}`,
            })}
          >
            <Typography variant="h6">Income & balance</Typography>
            <IconButton onClick={onClose} color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2} sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="body2" color="text.secondary">
              Monthly income and savings balance feed your budget and goal forecast.
            </Typography>

            <TextField label="Monthly income" value={form.monthlyIncome} onChange={(event) => setForm((current) => ({ ...current, monthlyIncome: event.target.value }))} />
            <TextField label="Current saved amount" value={form.savingsTarget} onChange={(event) => setForm((current) => ({ ...current, savingsTarget: event.target.value }))} />

            <Box sx={(t) => ({ borderRadius: radiusInner(t), bgcolor: alpha(t.palette.common.white, 0.05), border: `1px solid ${alpha(t.palette.common.white, 0.08)}`, p: 1.75 })}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Monthly income
                </Typography>
                <Typography fontWeight={700}>{formatCurrency(monthlyIncome)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current balance
                </Typography>
                <Typography fontWeight={700}>{formatCurrency(currentBalance)}</Typography>
              </Stack>
            </Box>

            {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}

            <Button variant="contained" color="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} sx={{ minHeight: 48 }}>
              {mutation.isPending ? "Saving..." : "Update income"}
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
