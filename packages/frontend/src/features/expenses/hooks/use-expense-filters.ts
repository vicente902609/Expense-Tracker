import { useMemo, useState } from "react";
import type { Expense } from "@expense-tracker/shared";

const getMonthStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
};

const getToday = () => new Date().toISOString().slice(0, 10);

export const useExpenseFilters = (expenses: Expense[]) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [fromDate, setFromDate] = useState(getMonthStart);
  const [toDate, setToDate] = useState(getToday);

  const filteredExpenses = useMemo(
    () =>
      expenses.filter((expense) => {
        const matchesCategory = selectedCategory === "All" || expense.category === selectedCategory;
        const matchesDate = expense.date >= fromDate && expense.date <= toDate;
        return matchesCategory && matchesDate;
      }),
    [expenses, fromDate, selectedCategory, toDate],
  );

  const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    selectedCategory,
    setSelectedCategory,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    filteredExpenses,
    total,
  };
};
