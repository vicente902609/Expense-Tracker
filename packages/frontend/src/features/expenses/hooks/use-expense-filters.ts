import { useMemo, useState } from "react";
import type { Expense } from "@expense-tracker/shared";

import { useDateFilter } from "@/hooks/use-date-filter";

export const useExpenseFilters = (expenses: Expense[]) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const dateFilter = useDateFilter("month", "expenses");

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesCategory = selectedCategory === "All" || expense.category === selectedCategory;
        const matchesDate = expense.date >= dateFilter.fromDate && expense.date <= dateFilter.toDate;
        return matchesCategory && matchesDate;
      }),
    [expenses, dateFilter.fromDate, dateFilter.toDate, selectedCategory],
  );

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    selectedCategory,
    setSelectedCategory,
    filteredExpenses,
    total,
    ...dateFilter,
  };
};
