import { useState } from "react";
import { Button, Card, CardContent, Divider, List, ListItem, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteExpense, listExpenses, updateExpense } from "../../api/expenses.js";

export const ExpensesList = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });
  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: listExpenses,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId }: { expenseId: string }) =>
      updateExpense(expenseId, {
        amount: Number(draft.amount),
        description: draft.description,
        category: draft.category,
        date: draft.date,
        aiParsed: false,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const expenses = expensesQuery.data ?? [];
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = expenses.filter((expense) => expense.date.startsWith(monthKey)).reduce((total, expense) => total + expense.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount;
    return totals;
  }, {});
  const topCategories = Object.entries(categoryTotals)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Recent Expenses</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Card variant="outlined" sx={{ flex: 1, bgcolor: "rgba(15,118,110,0.04)" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  This Month
                </Typography>
                <Typography variant="h5">${monthSpend.toFixed(2)}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1, bgcolor: "rgba(194,65,12,0.05)" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Top Categories
                </Typography>
                <Typography>
                  {topCategories.length > 0
                    ? topCategories.map(([category, total]) => `${category} $${total.toFixed(0)}`).join(" · ")
                    : "No spending yet"}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
          <List disablePadding>
            {(expensesQuery.data ?? []).map((expense, index) => (
              <div key={expense.id}>
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      {editingId === expense.id ? (
                        <>
                          <Button onClick={() => updateMutation.mutate({ expenseId: expense.id })}>Save</Button>
                          <Button color="inherit" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            color="inherit"
                            onClick={() => {
                              setEditingId(expense.id);
                              setDraft({
                                amount: expense.amount.toString(),
                                description: expense.description,
                                category: expense.category,
                                date: expense.date,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button color="inherit" onClick={() => deleteMutation.mutate(expense.id)}>
                            Delete
                          </Button>
                        </>
                      )}
                    </Stack>
                  }
                >
                  {editingId === expense.id ? (
                    <Stack spacing={1.5} sx={{ width: "100%", pr: 12 }}>
                      <TextField label="Amount" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} />
                      <TextField
                        label="Description"
                        value={draft.description}
                        onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      />
                      <TextField label="Category" value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} />
                      <TextField
                        label="Date"
                        type="date"
                        value={draft.date}
                        onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Stack>
                  ) : (
                    <ListItemText
                      primary={`${expense.description} · $${expense.amount.toFixed(2)}`}
                      secondary={`${expense.category} · ${expense.date}${expense.aiParsed ? " · AI parsed" : ""}`}
                    />
                  )}
                </ListItem>
                {index < (expensesQuery.data?.length ?? 0) - 1 ? <Divider /> : null}
              </div>
            ))}
          </List>
          {!expensesQuery.isLoading && (expensesQuery.data?.length ?? 0) === 0 ? (
            <Typography color="text.secondary">No expenses yet. Add one manually or use Add Expense.</Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};
