import { expenseCategoryValues, type Expense, type Goal } from "@expense-tracker/shared";

export const predefinedCategories = expenseCategoryValues;

export type CategoryPaletteEntry = {
  name: string;
  color: string;
};

const fallbackCategoryColor = "#8e8e87";

/** Merge API predefined + custom rows for swatches and charts (both carry `name` + `color`). */
export const buildCategoryPalette = (
  predefined: readonly { name: string; color: string }[],
  custom: readonly { name: string; color: string }[],
): CategoryPaletteEntry[] => [
  ...predefined.map((row) => ({ name: row.name, color: row.color })),
  ...custom.map((row) => ({ name: row.name, color: row.color })),
];

/**
 * Resolve a dot/chip color from the palette built from `GET /categories` (predefined + custom).
 */
export const getCategoryColor = (category: string, palette?: readonly CategoryPaletteEntry[]) => {
  const hit = palette?.find((entry) => entry.name === category);
  return hit?.color ?? fallbackCategoryColor;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const currencyPreciseFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatCurrency = (value: number, precise = false) =>
  (precise ? currencyPreciseFormatter : currencyFormatter).format(value);

/** Local calendar YYYY-MM-DD (avoid UTC drift from toISOString). */
export const formatLocalIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/** YYYY-MM-DD strings are stored as calendar days; format using local date parts (no UTC midnight shift). */
const localDateFromIso = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
    return new Date(NaN);
  }
  return new Date(y, m - 1, d);
};

export const formatMonthLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(localDateFromIso(isoDate));

export const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(localDateFromIso(isoDate));

export const getCurrentMonthExpenses = (expenses: Expense[]) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return expenses.filter((expense) => expense.date.startsWith(currentMonth));
};

export const getSpendInCalendarMonth = (expenses: Expense[], monthOffset: number) => {
  const reference = new Date();
  const target = new Date(reference.getFullYear(), reference.getMonth() + monthOffset, 1);
  const monthKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
  return expenses.filter((expense) => expense.date.startsWith(monthKey)).reduce((sum, expense) => sum + expense.amount, 0);
};

export const formatSpendVsPriorMonth = (currentMonthSpend: number, priorMonthSpend: number): string => {
  if (currentMonthSpend <= 0 && priorMonthSpend <= 0) {
    return "no spending yet this month";
  }

  if (priorMonthSpend <= 0) {
    return "first month with spending";
  }

  const ratio = (currentMonthSpend - priorMonthSpend) / priorMonthSpend;
  const pct = Math.round(ratio * 100);
  const direction = pct > 0 ? "↑" : pct < 0 ? "↓" : "→";
  return `${direction} ${Math.abs(pct)}% vs prior month`;
};

export const getGoalProgress = (goal: Goal) => {
  if (goal.targetAmount <= 0) {
    return 0;
  }

  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
};

export const getMonthlySeries = (expenses: Expense[]) => {
  const today = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - index), 1));
    const monthKey = date.toISOString().slice(0, 7);
    const total = expenses.filter((expense) => expense.date.startsWith(monthKey)).reduce((sum, expense) => sum + expense.amount, 0);

    return {
      key: monthKey,
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(date),
      total,
    };
  });
};

/**
 * Every calendar month that intersects [fromIso, toIso], including zero-month buckets.
 */
export const getMonthlySeriesForRange = (expenses: Expense[], fromIso: string, toIso: string): ChartSeriesPoint[] => {
  const totals = expenses.reduce<Record<string, number>>((acc, expense) => {
    if (expense.date >= fromIso && expense.date <= toIso) {
      const monthKey = expense.date.slice(0, 7);
      acc[monthKey] = (acc[monthKey] ?? 0) + expense.amount;
    }
    return acc;
  }, {});

  const [fromY, fromM] = fromIso.split("-").map(Number);
  const [toY, toM] = toIso.split("-").map(Number);

  const cursor = new Date(fromY, fromM - 1, 1);
  const end = new Date(toY, toM - 1, 1);
  const out: ChartSeriesPoint[] = [];

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const monthKey = `${year}-${pad2(month)}`;
    out.push({
      key: monthKey,
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
        new Date(Date.UTC(year, month - 1, 1)),
      ),
      total: totals[monthKey] ?? 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return out;
};

export type ChartSeriesPoint = { key: string; label: string; total: number };

export const getDailySeries = (expenses: Expense[]) =>
  Object.entries(
    expenses.reduce<Record<string, number>>((totals, expense) => {
      totals[expense.date] = (totals[expense.date] ?? 0) + expense.amount;
      return totals;
    }, {}),
  )
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, total]) => ({
      key,
      label: formatShortDate(key),
      total,
    }));

const pad2 = (n: number) => String(n).padStart(2, "0");
const toLocalIso = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseLocalIsoDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const addDaysLocal = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const dominantMonthOfWeek = (weekStart: Date) => {
  const monthCounts = new Map<number, number>();
  for (let i = 0; i < 7; i += 1) {
    const day = addDaysLocal(weekStart, i);
    const month = day.getMonth();
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
  }

  let dominantMonth = weekStart.getMonth();
  let maxCount = 0;
  for (const [month, count] of monthCounts.entries()) {
    if (count > maxCount) {
      dominantMonth = month;
      maxCount = count;
    }
  }
  return dominantMonth;
};

const weekIndexInDominantMonth = (weekStart: Date, dominantMonth: number) => {
  const cursor = mondayOfLocalWeek(new Date(weekStart.getFullYear(), dominantMonth, 1));
  let index = 0;

  while (cursor <= weekStart) {
    if (dominantMonthOfWeek(cursor) === dominantMonth) {
      index += 1;
    }
    cursor.setDate(cursor.getDate() + 7);
  }

  return Math.max(index, 1);
};

const formatMonthWeekLabel = (weekStartIso: string) => {
  const weekStart = parseLocalIsoDate(weekStartIso);
  const dominantMonth = dominantMonthOfWeek(weekStart);
  const monthLabel = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(weekStart.getFullYear(), dominantMonth, 1)),
  );
  const weekIndex = weekIndexInDominantMonth(weekStart, dominantMonth);
  return `${monthLabel} W${weekIndex}`;
};

/** Monday 00:00 local for the week containing `d`. */
const mondayOfLocalWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

const formatWeekdayShortLabel = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(y, m - 1, d));
};

type DailySeriesOptions = {
  /** Use Mon/Tue/… instead of month+day (e.g. Reports “This week” weekdays). */
  weekdayLabels?: boolean;
};

/**
 * Every calendar day in [fromIso, toIso] with spend, including zero when no expense that day.
 */
export const getDailySeriesForRange = (
  expenses: Expense[],
  fromIso: string,
  toIso: string,
  options?: DailySeriesOptions,
): ChartSeriesPoint[] => {
  const totals = expenses.reduce<Record<string, number>>((acc, expense) => {
    if (expense.date >= fromIso && expense.date <= toIso) {
      acc[expense.date] = (acc[expense.date] ?? 0) + expense.amount;
    }
    return acc;
  }, {});

  const out: ChartSeriesPoint[] = [];
  const cursor = parseLocalIsoDate(fromIso);
  const end = parseLocalIsoDate(toIso);
  const useWeekday = Boolean(options?.weekdayLabels);
  while (cursor <= end) {
    const key = toLocalIso(cursor);
    out.push({
      key,
      label: useWeekday ? formatWeekdayShortLabel(key) : formatShortDate(key),
      total: totals[key] ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

export const getWeeklySeries = (expenses: Expense[]) => {
  const totals = expenses.reduce<Record<string, number>>((result, expense) => {
    const date = new Date(`${expense.date}T00:00:00.000Z`);
    const day = date.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setUTCDate(date.getUTCDate() + diff);
    const weekKey = date.toISOString().slice(0, 10);
    result[weekKey] = (result[weekKey] ?? 0) + expense.amount;
    return result;
  }, {});

  return Object.entries(totals)
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([key, total]) => ({
      key,
      label: `Week of ${formatShortDate(key)}`,
      total,
    }));
};

/**
 * Every Monday-start week that intersects [fromIso, toIso], with spend (including zero weeks).
 * Week keys use local Monday YYYY-MM-DD (aligned with report date filters).
 */
export const getWeeklySeriesForRange = (expenses: Expense[], fromIso: string, toIso: string): ChartSeriesPoint[] => {
  const totals = expenses.reduce<Record<string, number>>((result, expense) => {
    const mon = mondayOfLocalWeek(parseLocalIsoDate(expense.date));
    const weekKey = toLocalIso(mon);
    if (expense.date >= fromIso && expense.date <= toIso) {
      result[weekKey] = (result[weekKey] ?? 0) + expense.amount;
    }
    return result;
  }, {});

  const firstMon = mondayOfLocalWeek(parseLocalIsoDate(fromIso));
  const lastMon = mondayOfLocalWeek(parseLocalIsoDate(toIso));
  const out: ChartSeriesPoint[] = [];
  const cursor = new Date(firstMon);
  while (cursor <= lastMon) {
    const key = toLocalIso(cursor);
    out.push({ key, label: formatMonthWeekLabel(key), total: totals[key] ?? 0 });
    cursor.setDate(cursor.getDate() + 7);
  }
  return out;
};

export const getCategoryTotals = (expenses: Expense[]) => {
  const totals = expenses.reduce<Record<string, number>>((result, expense) => {
    result[expense.category] = (result[expense.category] ?? 0) + expense.amount;
    return result;
  }, {});

  return Object.entries(totals)
    .map(([category, total]) => ({ category, total }))
    .sort((left, right) => right.total - left.total);
};

