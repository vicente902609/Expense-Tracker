import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getBudgetPlan, upsertBudgetPlan } from "../../api/goals.js";

export const BudgetPlanForm = () => {
  const queryClient = useQueryClient();
  const budgetQuery = useQuery({
    queryKey: ["budget-plan"],
    queryFn: getBudgetPlan,
  });
  const [form, setForm] = useState({
    monthlyIncome: "0",
    fixedCosts: "0",
    savingsTarget: "0",
  });

  useEffect(() => {
    if (!budgetQuery.data) {
      return;
    }

    setForm({
      monthlyIncome: budgetQuery.data.monthlyIncome.toString(),
      fixedCosts: budgetQuery.data.fixedCosts.toString(),
      savingsTarget: budgetQuery.data.savingsTarget.toString(),
    });
  }, [budgetQuery.data]);

  const mutation = useMutation({
    mutationFn: () =>
      upsertBudgetPlan({
        monthlyIncome: Number(form.monthlyIncome),
        fixedCosts: Number(form.fixedCosts),
        savingsTarget: Number(form.savingsTarget),
        incomeSources: {
          salary: Number(form.monthlyIncome),
          freelance: 0,
          businessRevenue: 0,
          passiveIncome: 0,
        },
        plannedExpenses: {
          food: 0,
          rent: Number(form.fixedCosts),
          transport: 0,
          subscriptions: 0,
          shopping: 0,
        },
        categoryLimits: {},
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["budget-plan"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Budget Plan</Typography>
          <TextField
            label="Monthly income"
            value={form.monthlyIncome}
            onChange={(event) => setForm((current) => ({ ...current, monthlyIncome: event.target.value }))}
          />
          <TextField
            label="Fixed costs"
            value={form.fixedCosts}
            onChange={(event) => setForm((current) => ({ ...current, fixedCosts: event.target.value }))}
          />
          <TextField
            label="Current saved amount"
            value={form.savingsTarget}
            onChange={(event) => setForm((current) => ({ ...current, savingsTarget: event.target.value }))}
          />
          {mutation.error ? <Alert severity="error">{mutation.error.message}</Alert> : null}
          <Button variant="contained" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Budget"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};
