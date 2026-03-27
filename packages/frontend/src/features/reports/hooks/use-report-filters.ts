import { useMemo, useState } from "react";
import type { Expense } from "@expense-tracker/shared";

type ReportMode = "daily" | "weekly" | "monthly" | "range";

const getIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfWeek = (date: Date) => {
  const clone = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = clone.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  clone.setUTCDate(clone.getUTCDate() + diff);
  return clone;
};

const endOfWeek = (date: Date) => {
  const clone = startOfWeek(date);
  clone.setUTCDate(clone.getUTCDate() + 6);
  return clone;
};

const startOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const endOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));

const getRangeForMode = (mode: ReportMode) => {
  const today = new Date();

  if (mode === "daily") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6));
    return { fromDate: getIsoDate(from), toDate: getIsoDate(today) };
  }

  if (mode === "weekly") {
    const from = startOfWeek(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 49)));
    return {
      fromDate: getIsoDate(from),
      toDate: getIsoDate(endOfWeek(today)),
    };
  }

  if (mode === "monthly") {
    const from = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));
    return {
      fromDate: getIsoDate(from),
      toDate: getIsoDate(endOfMonth(today)),
    };
  }

  return {
    fromDate: getIsoDate(startOfMonth(today)),
    toDate: getIsoDate(today),
  };
};

export const useReportFilters = (expenses: Expense[]) => {
  const [mode, setMode] = useState<ReportMode>("monthly");
  const [dateRange, setDateRange] = useState(getRangeForMode("monthly"));

  const changeMode = (nextMode: ReportMode) => {
    setMode(nextMode);
    setDateRange(getRangeForMode(nextMode));
  };

  const filteredExpenses = useMemo(
    () => expenses.filter((expense) => expense.date >= dateRange.fromDate && expense.date <= dateRange.toDate),
    [dateRange.fromDate, dateRange.toDate, expenses],
  );

  return {
    mode,
    changeMode,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    setFromDate: (fromDate: string) => setDateRange((current) => ({ ...current, fromDate })),
    setToDate: (toDate: string) => setDateRange((current) => ({ ...current, toDate })),
    filteredExpenses,
  };
};
