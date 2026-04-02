import {
  createExpenseBodySchema,
  listExpensesQuerySchema,
  updateExpenseBodySchema,
} from "@expense-tracker/shared";

import { AppError } from "../../lib/errors.js";
import { recalculateGoalInsight } from "../goals/service.js";
import {
  countAndSumExpenses,
  createExpense,
  deleteExpense,
  getExpenseById,
  listExpensesPage,
  updateExpense,
} from "./repository.js";

export const listUserExpenses = async (userId: string, query: unknown) => {
  const parsed = listExpensesQuerySchema.parse(query);
  const [page, stats] = await Promise.all([
    listExpensesPage(userId, parsed),
    countAndSumExpenses(userId, parsed),
  ]);
  return {
    ...page,
    totalCount: stats.count,
    totalAmount: stats.totalAmount,
  };
};

export const getUserExpense = async (userId: string, expenseId: string) => {
  const expense = await getExpenseById(userId, expenseId);
  if (!expense) {
    throw new AppError("Expense not found", 404);
  }
  return expense;
};

export const createUserExpense = async (userId: string, payload: unknown) => {
  const input = createExpenseBodySchema.parse(payload);
  const expense = await createExpense(userId, input);
  await recalculateGoalInsight(userId);
  return expense;
};

export const updateUserExpense = async (userId: string, expenseId: string, payload: unknown) => {
  const parsed = updateExpenseBodySchema.parse(payload);
  const raw = payload as Record<string, unknown>;
  const existing = await getExpenseById(userId, expenseId);

  if (!existing) {
    throw new AppError("Expense not found", 404);
  }

  const amount = parsed.amount ?? existing.amount;
  const description = "description" in raw ? parsed.description : existing.description;
  const categoryId = parsed.categoryId ?? existing.categoryId;
  const date = parsed.date ?? existing.date;

  const expense = await updateExpense(userId, expenseId, {
    amount,
    description,
    categoryId,
    date,
  });

  if (!expense) {
    throw new AppError("Expense not found", 404);
  }

  await recalculateGoalInsight(userId);

  return expense;
};

export const deleteUserExpense = async (userId: string, expenseId: string) => {
  const deleted = await deleteExpense(userId, expenseId);

  if (!deleted) {
    throw new AppError("Expense not found", 404);
  }

  await recalculateGoalInsight(userId);
  return { expenseId };
};
