import type {
  CreateExpenseBody,
  Expense,
  ListExpensesQuery,
  ListExpensesResponse,
  UpdateExpenseBody,
} from "@expense-tracker/shared";

import { apiRequest } from "@/api/client";

const toQueryString = (query?: ListExpensesQuery) => {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  if (query.startDate) {
    params.set("startDate", query.startDate);
  }
  if (query.endDate) {
    params.set("endDate", query.endDate);
  }
  if (query.categoryId) {
    params.set("categoryId", query.categoryId);
  }
  if (query.limit != null) {
    params.set("limit", String(query.limit));
  }
  if (query.cursor) {
    params.set("cursor", query.cursor);
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

export const listExpensesPage = (query?: ListExpensesQuery) =>
  apiRequest<ListExpensesResponse>(`/expenses${toQueryString(query)}`);

/** Paginates until exhausted — use for dashboards, reports, categories when the full set is required. */
export const fetchExpensesInRange = async (startDate: string, endDate: string): Promise<Expense[]> => {
  const out: Expense[] = [];
  let cursor: string | undefined;
  do {
    const { expenses, nextCursor } = await listExpensesPage({
      startDate,
      endDate,
      limit: 100,
      cursor,
    });
    out.push(...expenses);
    cursor = nextCursor;
  } while (cursor);
  return out;
};

/** All expenses for the user (no date filter), via cursor pagination. */
export const fetchAllExpenses = async (): Promise<Expense[]> => {
  const out: Expense[] = [];
  let cursor: string | undefined;
  do {
    const { expenses, nextCursor } = await listExpensesPage({ cursor, limit: 100 });
    out.push(...expenses);
    cursor = nextCursor;
  } while (cursor);
  return out;
};

export const getExpense = (expenseId: string) =>
  apiRequest<Expense>(`/expenses/${encodeURIComponent(expenseId)}`);

export const createExpense = (payload: CreateExpenseBody) =>
  apiRequest<Expense>("/expenses", { method: "POST", body: payload });

export const updateExpense = (expenseId: string, payload: UpdateExpenseBody) =>
  apiRequest<Expense>(`/expenses/${encodeURIComponent(expenseId)}`, { method: "PUT", body: payload });

export const deleteExpense = (expenseId: string) =>
  apiRequest<{ expenseId: string }>(`/expenses/${encodeURIComponent(expenseId)}`, { method: "DELETE" });
