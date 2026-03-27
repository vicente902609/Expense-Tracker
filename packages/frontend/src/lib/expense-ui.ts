import { expenseCategoryValues, type BudgetPlan, type Expense, type Goal } from "@expense-tracker/shared";

export const predefinedCategories = expenseCategoryValues;

/** Distinct hues for charts / dots on dark UI (predefined categories from shared package). */
const categoryColors: Record<string, string> = {
  Food: "#2fb58d",
  Transport: "#4f8ff7",
  Housing: "#f0a060",
  Utilities: "#f4b03e",
  Entertainment: "#ef5a94",
  Health: "#4ade80",
  Shopping: "#e879f9",
  Travel: "#38bdf8",
  Education: "#818cf8",
  Subscriptions: "#c084fc",
  Other: "#8e8e87",
};

export const getCategoryColor = (category: string) => categoryColors[category] ?? "#8e8e87";

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

export const formatMonthLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));

export const formatShortDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));

export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
};

export const getInitials = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

export const getCurrentMonthExpenses = (expenses: Expense[]) => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return expenses.filter((expense) => expense.date.startsWith(currentMonth));
};

export const getSpendInCalendarMonth = (expenses: Expense[], monthOffset: number) => {
  const reference = new Date();
  const target = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + monthOffset, 1));
  const monthKey = target.toISOString().slice(0, 7);
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

/** Monday 00:00 local for the week containing `d`. */
const mondayOfLocalWeek = (d: Date) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
};

/**
 * Every calendar day in [fromIso, toIso] with spend, including zero when no expense that day.
 */
export const getDailySeriesForRange = (expenses: Expense[], fromIso: string, toIso: string): ChartSeriesPoint[] => {
  const totals = expenses.reduce<Record<string, number>>((acc, expense) => {
    if (expense.date >= fromIso && expense.date <= toIso) {
      acc[expense.date] = (acc[expense.date] ?? 0) + expense.amount;
    }
    return acc;
  }, {});

  const out: ChartSeriesPoint[] = [];
  const cursor = parseLocalIsoDate(fromIso);
  const end = parseLocalIsoDate(toIso);
  while (cursor <= end) {
    const key = toLocalIso(cursor);
    out.push({ key, label: formatShortDate(key), total: totals[key] ?? 0 });
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
    out.push({ key, label: `Week of ${formatShortDate(key)}`, total: totals[key] ?? 0 });
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

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export const getBudgetSummary = (budgetPlan: BudgetPlan | null | undefined, monthExpenses: Expense[]) => {
  const incomeTotal = budgetPlan?.monthlyIncome ?? 0;
  const actualSpent = sum(monthExpenses.map((expense) => expense.amount));
  const monthlyBalance = incomeTotal - actualSpent;
  const remainingBudget = Math.max(monthlyBalance, 0);
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(daysInMonth - now.getDate(), 1);
  const dailyBudget = remainingBudget / daysLeft;

  return {
    incomeTotal,
    actualSpent,
    monthlyBalance,
    remainingBudget,
    dailyBudget,
    daysLeft,
    currentBalance: budgetPlan?.savingsTarget ?? 0,
  };
};
