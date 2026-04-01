import { useState } from "react";
import type { Expense } from "@expense-tracker/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { parseExpenseText } from "@/api/ai";
import { createExpense, deleteExpense, updateExpense } from "@/api/expenses";
import { type CategoryPaletteEntry, formatLocalIsoDate, resolveCategoryIdFromName } from "@/lib/expense-ui";

export type ExpenseFormState = {
  amount: string;
  date: string;
  description: string;
  categoryId: string;
};

const createEmptyForm = (): ExpenseFormState => ({
  amount: "",
  date: formatLocalIsoDate(new Date()),
  description: "",
  categoryId: "",
});

const expenseToForm = (expense: Expense): ExpenseFormState => ({
  amount: expense.amount.toString(),
  date: expense.date,
  description: expense.description ?? "",
  categoryId: expense.categoryId,
});

export const useExpenseEditor = (
  expense: Expense | null | undefined,
  categoryPalette: readonly CategoryPaletteEntry[],
  onClose: () => void,
) => {
  const queryClient = useQueryClient();
  const [smartText, setSmartText] = useState("");
  const [form, setForm] = useState<ExpenseFormState>(() => (expense ? expenseToForm(expense) : createEmptyForm()));

  const invalidateData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["goals"] }),
      queryClient.invalidateQueries({ queryKey: ["reports"] }),
    ]);
  };

  const parseMutation = useMutation({
    mutationFn: () => parseExpenseText(smartText),
    onSuccess: (data) => {
      const categoryName = data.category ?? "";
      const categoryId = resolveCategoryIdFromName(categoryName, categoryPalette);
      setForm({
        amount: data.amount?.toString() ?? "",
        date: data.date ?? formatLocalIsoDate(new Date()),
        description: data.description ?? "",
        categoryId,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const amount = Number(form.amount);
      const description = form.description.trim();
      if (expense) {
        return updateExpense(expense.expenseId, {
          amount,
          date: form.date,
          description: description.length ? description : undefined,
          categoryId: form.categoryId,
        });
      }
      return createExpense({
        amount,
        date: form.date,
        description: description.length ? description : undefined,
        categoryId: form.categoryId,
      });
    },
    onSuccess: async () => {
      await invalidateData();
      onClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteExpense(expense!.expenseId),
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
