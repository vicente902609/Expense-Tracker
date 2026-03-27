import type { Expense, ExpenseInput } from "@expense-tracker/shared";

import { apiRequest } from "./client.js";

export const listExpenses = () => apiRequest<Expense[]>("/expenses");
export const createExpense = (payload: ExpenseInput) => apiRequest<Expense>("/expenses", { method: "POST", body: payload });
export const updateExpense = (expenseId: string, payload: ExpenseInput) =>
  apiRequest<Expense>(`/expenses/${expenseId}`, { method: "PUT", body: payload });
export const deleteExpense = (expenseId: string) => apiRequest<void>(`/expenses/${expenseId}`, { method: "DELETE" });
