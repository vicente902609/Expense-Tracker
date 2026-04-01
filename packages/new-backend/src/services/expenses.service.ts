import { v4 as uuidv4 } from 'uuid';
import type { Expense, ExpenseItem } from '../models/expense';
import { toExpense } from '../models/expense';
import type { ListExpensesOptions } from '../repositories/expense.repository';
import {
  createExpense as createExpenseInDb,
  deleteExpenseByUser,
  getExpenseByUser,
  listExpensesByUser,
  updateExpenseByUser,
} from '../repositories/expense.repository';

export interface ListExpensesResult {
  expenses: Expense[];
  nextCursor?: string;
}

export const listExpenses = async (
  userId: string,
  options: ListExpensesOptions,
): Promise<ListExpensesResult> => {
  const { items, nextCursor } = await listExpensesByUser(userId, options);
  return { expenses: items.map(toExpense), nextCursor };
};

export const createExpense = async (
  userId: string,
  input: { amount: number; description?: string; categoryId: string; date: string },
): Promise<Expense> => {
  const expenseId = uuidv4();
  const now = new Date().toISOString();

  const item: ExpenseItem = {
    PK: `USER#${userId}`,
    SK: `EXP#${expenseId}`,
    GSI2PK: `USER#${userId}`,
    GSI2SK: `DATE#${input.date}#${expenseId}`,
    GSI3PK: `USER#${userId}#CAT#${input.categoryId}`,
    GSI3SK: `DATE#${input.date}#${expenseId}`,
    expenseId,
    amount: input.amount,
    description: input.description,
    categoryId: input.categoryId,
    date: input.date,
    createdAt: now,
    updatedAt: now,
  };

  await createExpenseInDb(item);
  return toExpense(item);
};

export const getExpense = async (userId: string, expenseId: string): Promise<Expense | null> => {
  const item = await getExpenseByUser(userId, expenseId);
  return item ? toExpense(item) : null;
};

export const updateExpense = async (
  userId: string,
  expenseId: string,
  input: { amount?: number; description?: string; categoryId?: string; date?: string },
): Promise<Expense | null> => {
  const existing = await getExpenseByUser(userId, expenseId);
  if (!existing) return null;

  const amount = input.amount ?? existing.amount;
  // If 'description' key is present in input (even as undefined/empty string), use it; otherwise keep existing
  const description = 'description' in input ? input.description : existing.description;
  const categoryId = input.categoryId ?? existing.categoryId;
  const date = input.date ?? existing.date;
  const updatedAt = new Date().toISOString();

  const updated = await updateExpenseByUser(userId, expenseId, {
    amount,
    description,
    categoryId,
    date,
    GSI2PK: `USER#${userId}`,
    GSI2SK: `DATE#${date}#${expenseId}`,
    GSI3PK: `USER#${userId}#CAT#${categoryId}`,
    GSI3SK: `DATE#${date}#${expenseId}`,
    updatedAt,
  });

  return toExpense(updated);
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<boolean> => {
  const existing = await getExpenseByUser(userId, expenseId);
  if (!existing) return false;

  await deleteExpenseByUser(userId, expenseId);
  return true;
};
