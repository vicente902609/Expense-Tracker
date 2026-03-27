import { expenseFiltersSchema, expenseInputSchema } from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { recalculateGoalForecasts } from "../goals/service.js";
import { createExpense, deleteExpense, listExpenses, updateExpense } from "./repository.js";

export const listUserExpenses = async (userId: string, filters: unknown) => {
  const parsedFilters = expenseFiltersSchema.parse(filters);
  return listExpenses(userId, parsedFilters);
};

export const createUserExpense = async (userId: string, payload: unknown) => {
  const input = expenseInputSchema.parse(payload);
  const expense = await createExpense(userId, input);
  await recalculateGoalForecasts(userId, {
    force: true,
  });
  return expense;
};

export const updateUserExpense = async (userId: string, expenseId: string, payload: unknown) => {
  const input = expenseInputSchema.parse(payload);
  const expense = await updateExpense(userId, expenseId, input);

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  await recalculateGoalForecasts(userId, {
    force: true,
  });

  return expense;
};

export const deleteUserExpense = async (userId: string, expenseId: string) => {
  const deleted = await deleteExpense(userId, expenseId);

  if (!deleted) {
    throw new AppError("Expense not found", 404);
  }

  await recalculateGoalForecasts(userId, {
    force: true,
  });
};
