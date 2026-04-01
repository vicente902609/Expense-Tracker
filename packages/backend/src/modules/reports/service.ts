import type { ByCategoryReportResponse, MonthlyReportResponse } from "@expense-tracker/shared";

import { findExpensesInDateRangeForReports } from "../expenses/repository.js";

export const getMonthlyReport = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<MonthlyReportResponse> => {
  const items = await findExpensesInDateRangeForReports(userId, startDate, endDate);

  const totalsMap = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const month = item.date.slice(0, 7);
    const entry = totalsMap.get(month) ?? { total: 0, count: 0 };
    entry.total = Math.round((entry.total + item.amount) * 100) / 100;
    entry.count += 1;
    totalsMap.set(month, entry);
  }

  const months = Array.from(totalsMap.entries())
    .map(([month, { total, count }]) => ({ month, total, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { months };
};

export const getByCategoryReport = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<ByCategoryReportResponse> => {
  const items = await findExpensesInDateRangeForReports(userId, startDate, endDate);

  const totalsMap = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const entry = totalsMap.get(item.categoryId) ?? { total: 0, count: 0 };
    entry.total = Math.round((entry.total + item.amount) * 100) / 100;
    entry.count += 1;
    totalsMap.set(item.categoryId, entry);
  }

  const categories = Array.from(totalsMap.entries())
    .map(([categoryId, { total, count }]) => ({ categoryId, total, count }))
    .sort((a, b) => b.total - a.total);

  return { categories };
};
