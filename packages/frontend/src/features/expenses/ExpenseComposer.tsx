import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Skeleton, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createExpense, parseExpense } from "../../api/expenses.js";

const blankForm = {
  amount: "",
  description: "",
  category: "",
  date: "",
};

export const ExpenseComposer = () => {
  const queryClient = useQueryClient();
  const [smartText, setSmartText] = useState("");
  const [form, setForm] = useState(blankForm);

  const parseMutation = useMutation({
    mutationFn: () => parseExpense(smartText),
    onSuccess: (data) => {
      setForm({
        amount: data.amount?.toString() ?? "",
        description: data.description ?? "",
        category: data.category ?? "",
        date: data.date ?? "",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createExpense({
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        date: form.date,
        aiParsed: Boolean(smartText),
      }),
    onSuccess: () => {
      setSmartText("");
      setForm(blankForm);
      void queryClient.invalidateQueries({ queryKey: ["expenses"] });
      void queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Smart Entry</Typography>
            <Typography color="text.secondary">
              Type a natural-language expense, let AI prefill the form, then confirm.
            </Typography>
          </Box>

          <TextField
            label='Example: "grabbed lunch with a client $24 downtown yesterday"'
            value={smartText}
            onChange={(event) => setSmartText(event.target.value)}
            multiline
            minRows={2}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="contained" onClick={() => parseMutation.mutate()} disabled={parseMutation.isPending || smartText.trim().length < 3}>
              Smart Entry
            </Button>
            {parseMutation.data?.notes.map((note) => (
              <Chip key={note} label={note} variant="outlined" />
            ))}
          </Stack>

          {parseMutation.isPending ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
              <Skeleton variant="rounded" height={56} />
            </Stack>
          ) : null}

          {parseMutation.error ? <Alert severity="warning">{parseMutation.error.message}</Alert> : null}
          {createMutation.error ? <Alert severity="error">{createMutation.error.message}</Alert> : null}

          <Stack spacing={2}>
            <TextField
              label="Amount"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              required
              error={Boolean(smartText) && !form.amount}
              helperText={!form.amount ? "Required if AI left it blank." : ""}
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              required
              error={Boolean(smartText) && !form.description}
            />
            <TextField
              label="Category"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              required
              error={Boolean(smartText) && !form.category}
            />
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              required
              error={Boolean(smartText) && !form.date}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !form.amount || !form.description || !form.category || !form.date}
            >
              {createMutation.isPending ? "Saving..." : "Confirm Expense"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
