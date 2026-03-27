import { useEffect, useState } from "react";
import type { Expense } from "@expense-tracker/shared";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createExpense, deleteExpense, parseExpense, updateExpense } from "../../api/expenses.js";

type ExpenseEditorDialogProps = {
  availableCategories: string[];
  expense?: Expense | null;
  open: boolean;
  onClose: () => void;
};

const createEmptyForm = () => ({
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  category: "",
});

export const ExpenseEditorDialog = ({ availableCategories, expense, open, onClose }: ExpenseEditorDialogProps) => {
  const queryClient = useQueryClient();
  const [smartText, setSmartText] = useState("");
  const [form, setForm] = useState(createEmptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (expense) {
      setForm({
        amount: expense.amount.toString(),
        date: expense.date,
        description: expense.description,
        category: expense.category,
      });
      setSmartText("");
      return;
    }

    setForm(createEmptyForm());
    setSmartText("");
  }, [expense, open]);

  const invalidateData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
    ]);
  };

  const parseMutation = useMutation({
    mutationFn: () => parseExpense(smartText),
    onSuccess: (data) => {
      setForm({
        amount: data.amount?.toString() ?? "",
        date: data.date ?? new Date().toISOString().slice(0, 10),
        description: data.description ?? "",
        category: data.category ?? "",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        amount: Number(form.amount),
        date: form.date,
        description: form.description,
        category: form.category,
        aiParsed: Boolean(smartText),
      };

      return expense ? updateExpense(expense.id, payload) : createExpense(payload);
    },
    onSuccess: async () => {
      await invalidateData();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(expense!.id),
    onSuccess: async () => {
      await invalidateData();
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogContent sx={{ px: 0, pb: 0 }}>
        <Box
          sx={{
            mx: 2,
            mb: 2,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
            bgcolor: "rgba(56,56,53,0.96)",
          }}
        >
          <Stack alignItems="center" sx={{ pt: 1.5 }}>
            <Box sx={{ width: 44, height: 4, borderRadius: 999, bgcolor: "rgba(255,255,255,0.28)" }} />
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6">{expense ? "Edit Expense" : "Smart Entry"}</Typography>
              {!expense ? (
                <Box sx={{ px: 1, py: 0.25, borderRadius: 999, bgcolor: "rgba(79,143,247,0.18)", color: "#8fb9ff", fontSize: 12, fontWeight: 700 }}>
                  AI
                </Box>
              ) : null}
            </Stack>
            <IconButton onClick={onClose} color="inherit">
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack spacing={2.25} sx={{ p: 3 }}>
            {!expense ? (
              <>
                <Box>
                  <Typography sx={{ mb: 1, fontSize: 13, color: "text.secondary", fontWeight: 700 }}>Describe your expense</Typography>
                  <TextField
                    placeholder='grabbed lunch with a client $24 downtown yesterday'
                    value={smartText}
                    onChange={(event) => setSmartText(event.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                  />
                  <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary" }}>
                    Try: "coffee $4.50 this morning" or "Uber home last Friday $18"
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<AutoAwesomeRoundedIcon />}
                  onClick={() => parseMutation.mutate()}
                  disabled={parseMutation.isPending || smartText.trim().length < 3}
                >
                  Parse with AI
                </Button>

                {parseMutation.isPending ? (
                  <Stack spacing={1}>
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={52} />
                    <Skeleton variant="rounded" height={52} />
                  </Stack>
                ) : null}
              </>
            ) : null}

            {parseMutation.error ? <Alert severity="warning">{parseMutation.error.message}</Alert> : null}
            {saveMutation.error ? <Alert severity="error">{saveMutation.error.message}</Alert> : null}

            <Stack direction="row" spacing={1.5}>
              <TextField
                label="Amount"
                placeholder="$0.00"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                fullWidth
              />
              <TextField
                label="Date"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              fullWidth
            />

            <TextField
              label="Category"
              select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              fullWidth
            >
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="contained"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.amount || !form.description || !form.category || !form.date}
            >
              {saveMutation.isPending ? "Saving..." : expense ? "Save changes" : "Add expense"}
            </Button>

            {expense ? (
              <Button color="inherit" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? "Deleting..." : "Delete expense"}
              </Button>
            ) : null}
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};
