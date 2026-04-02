import { useState } from "react";
import { Button, Card, CardContent, Divider, List, ListItem, ListItemText, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { deleteExpense, fetchAllExpenses, updateExpense } from "@/api/expenses";
import { useCategories } from "@/hooks/use-categories";
import { amountTextFieldProps, buildCategoryPalette, getCategoryLabel } from "@/lib/expense-ui";

export const ExpensesList = () => {
  const queryClient = useQueryClient();
  const { custom, predefined } = useCategories();
  const categoryPalette = buildCategoryPalette(predefined, custom);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ amount: "", description: "", categoryId: "", date: "" });

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: fetchAllExpenses,
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
        description: draft.description.trim() || undefined,
        categoryId: draft.categoryId,
        date: draft.date,
      }),
    onSuccess: () => {
      setEditingId(null);
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  const expenses = expensesQuery.data ?? [];
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthSpend = expenses
    .filter((expense) => expense.date.startsWith(monthKey))
    .reduce((total, expense) => total + expense.amount, 0);
  const categoryTotals = expenses.reduce<Record<string, number>>((totals, expense) => {
    const label = getCategoryLabel(expense.categoryId, categoryPalette);
    totals[label] = (totals[label] ?? 0) + expense.amount;
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
              <div key={expense.expenseId}>
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      {editingId === expense.expenseId ? (
                        <>
                          <Button onClick={() => updateMutation.mutate({ expenseId: expense.expenseId })}>Save</Button>
                          <Button color="inherit" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            color="inherit"
                            onClick={() => {
                              setEditingId(expense.expenseId);
                              setDraft({
                                amount: expense.amount.toString(),
                                description: expense.description ?? "",
                                categoryId: expense.categoryId,
                                date: expense.date,
                              });
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            color="inherit"
                            onClick={() => deleteMutation.mutate(expense.expenseId)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </Stack>
                  }
                >
                  {editingId === expense.expenseId ? (
                    <Stack spacing={1.5} sx={{ width: "100%", pr: 12 }}>
                      <TextField
                        label="Amount"
                        {...amountTextFieldProps}
                        value={draft.amount}
                        onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))}
                      />
                      <TextField
                        label="Description"
                        value={draft.description}
                        onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                      />
                      <TextField
                        label="Category ID"
                        value={draft.categoryId}
                        onChange={(event) => setDraft((current) => ({ ...current, categoryId: event.target.value }))}
                        helperText="Predefined or custom category id from Categories"
                      />
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
                      primary={`${expense.description ?? "—"} · $${expense.amount.toFixed(2)}`}
                      secondary={`${getCategoryLabel(expense.categoryId, categoryPalette)} · ${expense.date}`}
                    />
                  )}
                </ListItem>
                {index < (expensesQuery.data?.length ?? 0) - 1 ? <Divider /> : null}
              </div>
            ))}
          </List>
          {!expensesQuery.isLoading && (expensesQuery.data?.length ?? 0) === 0 ? (
            <Typography color="text.secondary">
              No expenses yet. Add one manually or use Add Expense.
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
};
