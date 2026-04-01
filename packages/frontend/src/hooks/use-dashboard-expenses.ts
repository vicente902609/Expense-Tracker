import { useQuery } from "@tanstack/react-query";

import { fetchExpensesInRange } from "@/api/expenses";
import { formatLocalIsoDate } from "@/lib/expense-ui";

const getCurrentMonthToDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    startDate: formatLocalIsoDate(start),
    endDate: formatLocalIsoDate(now),
  };
};

const getPreviousCalendarMonthRange = () => {
  const now = new Date();
  const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastPrev = new Date(firstThisMonth.getTime() - 86400000);
  const firstPrev = new Date(lastPrev.getFullYear(), lastPrev.getMonth(), 1);
  return {
    startDate: formatLocalIsoDate(firstPrev),
    endDate: formatLocalIsoDate(lastPrev),
  };
};

export const useDashboardExpenses = () => {
  const currentQuery = useQuery({
    queryKey: ["expenses", "dashboard", "mtd"],
    queryFn: () => {
      const { startDate, endDate } = getCurrentMonthToDateRange();
      return fetchExpensesInRange(startDate, endDate);
    },
  });

  const priorQuery = useQuery({
    queryKey: ["expenses", "dashboard", "prior-month"],
    queryFn: () => {
      const { startDate, endDate } = getPreviousCalendarMonthRange();
      return fetchExpensesInRange(startDate, endDate);
    },
  });

  const expenses = currentQuery.data ?? [];
  const priorMonthSpend = (priorQuery.data ?? []).reduce((sum, e) => sum + e.amount, 0);
  const isLoading = currentQuery.isLoading || priorQuery.isLoading;

  return { expenses, priorMonthSpend, isLoading };
};
