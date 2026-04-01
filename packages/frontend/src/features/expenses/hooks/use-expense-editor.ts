import { useState } from "react";
import type { Expense } from "@expense-tracker/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { parseExpenseText } from "@/api/ai";
import { createExpense, deleteExpense, updateExpense } from "@/api/expenses";
import { formatLocalIsoDate } from "@/lib/expense-ui";

export type ExpenseFormState = {
  amount: string;
  date: string;
  description: string;
  category: string;
};

const createEmptyForm = (): ExpenseFormState => ({
  amount: "",
  date: formatLocalIsoDate(new Date()),
  description: "",
  category: "",
});

const expenseToForm = (expense: Expense): ExpenseFormState => ({
  amount: expense.amount.toString(),
  date: expense.date,
  description: expense.description,
  category: expense.category,
});

export const useExpenseEditor = (expense: Expense | null | undefined, onClose: () => void) => {
  const queryClient = useQueryClient();
  const [smartText, setSmartText] = useState("");
  const [form, setForm] = useState<ExpenseFormState>(() => (expense ? expenseToForm(expense) : createEmptyForm()));

  const invalidateData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
    ]);
  };

  const parseMutation = useMutation({
    mutationFn: () => parseExpenseText(smartText),
    onSuccess: (data) => {
      setForm({
        amount: data.amount?.toString() ?? "",
        date: data.date ?? formatLocalIsoDate(new Date()),
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

  return {
    form,
    setForm,
    smartText,
    setSmartText,
    parseMutation,
    saveMutation,
    deleteMutation,
  };
};
