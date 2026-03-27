import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Expense } from "@expense-tracker/shared";

import { updateExpense } from "../../../api/expenses.js";

type UseCategoryManagerParams = {
  customCategories: string[];
  deleteCategory: (category: string) => void;
  expenses: Expense[];
  renameCategory: (currentName: string, nextName: string) => void;
};

export const useCategoryManager = ({ customCategories, deleteCategory, expenses, renameCategory }: UseCategoryManagerParams) => {
  const queryClient = useQueryClient();

  const renameMutation = useMutation({
    mutationFn: async ({ currentName, nextName }: { currentName: string; nextName: string }) => {
      const affectedExpenses = expenses.filter((expense) => expense.category === currentName);

      await Promise.all(
        affectedExpenses.map((expense) =>
          updateExpense(expense.id, {
            amount: expense.amount,
            description: expense.description,
            category: nextName,
            date: expense.date,
            aiParsed: expense.aiParsed,
          }),
        ),
      );

      renameCategory(currentName, nextName);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (category: string) => {
      const affectedExpenses = expenses.filter((expense) => expense.category === category);

      await Promise.all(
        affectedExpenses.map((expense) =>
          updateExpense(expense.id, {
            amount: expense.amount,
            description: expense.description,
            category: "Other",
            date: expense.date,
            aiParsed: expense.aiParsed,
          }),
        ),
      );

      deleteCategory(category);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  return {
    customCategories,
    renameCategory: renameMutation.mutateAsync,
    renamePending: renameMutation.isPending,
    deleteCategory: deleteMutation.mutateAsync,
    deletePending: deleteMutation.isPending,
  };
};
