import { fetchAllExpensesInDateRange } from '../repositories/expense.repository';

export interface MonthlyTotal {
  month: string; // YYYY-MM
  total: number;
  count: number;
}

export interface MonthlyReportResult {
  months: MonthlyTotal[];
}

export const getMonthlyReport = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<MonthlyReportResult> => {
  const items = await fetchAllExpensesInDateRange(userId, startDate, endDate);

  const totalsMap = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const month = item.date.slice(0, 7); // YYYY-MM-DD → YYYY-MM
    const entry = totalsMap.get(month) ?? { total: 0, count: 0 };
    entry.total = Math.round((entry.total + item.amount) * 100) / 100;
    entry.count += 1;
    totalsMap.set(month, entry);
  }

  const months: MonthlyTotal[] = Array.from(totalsMap.entries())
    .map(([month, { total, count }]) => ({ month, total, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return { months };
};

export interface CategoryTotal {
  categoryId: string;
  total: number;
  count: number;
}

export interface ByCategoryReportResult {
  categories: CategoryTotal[];
}

export const getByCategoryReport = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<ByCategoryReportResult> => {
  const items = await fetchAllExpensesInDateRange(userId, startDate, endDate);

  const totalsMap = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const entry = totalsMap.get(item.categoryId) ?? { total: 0, count: 0 };
    entry.total = Math.round((entry.total + item.amount) * 100) / 100;
    entry.count += 1;
    totalsMap.set(item.categoryId, entry);
  }

  const categories: CategoryTotal[] = Array.from(totalsMap.entries())
    .map(([categoryId, { total, count }]) => ({ categoryId, total, count }))
    .sort((a, b) => b.total - a.total);

  return { categories };
};
