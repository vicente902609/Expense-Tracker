import type { BudgetPlan, Expense, Goal } from "@expense-tracker/shared";

export const predefinedCategories = ["Food", "Transport", "Entertainment", "Utilities"] as const;

const categoryColors: Record<string, string> = {
  Food: "#2fb58d",
  Transport: "#4f8ff7",
  Entertainment: "#ef5a94",
  Utilities: "#f4b03e",
  Gym: "#8c7af7",
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
