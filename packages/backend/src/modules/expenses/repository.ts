import type { Expense, ExpenseFilters, ExpenseInput } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

type ExpenseDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  amount: number;
  description: string;
  category: string;
  date: string;
  aiParsed: boolean;
  createdAt: string;
  updatedAt: string;
};

type NewExpenseDocument = Omit<ExpenseDocument, "_id">;

const mapExpense = (document: ExpenseDocument): Expense => ({
  id: document._id!.toHexString(),
  userId: document.userId.toHexString(),
  amount: document.amount,
  description: document.description,
  category: document.category,
  date: document.date,
  aiParsed: document.aiParsed,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const buildFilters = (userId: string, filters: ExpenseFilters) => {
  const query: Record<string, unknown> = {
    userId: toObjectId(userId),
  };

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.from || filters.to) {
    query.date = {
      ...(filters.from ? { $gte: filters.from } : {}),
      ...(filters.to ? { $lte: filters.to } : {}),
    };
  }

  return query;
};

export const getExpensesCollection = async () => {
  const database = await getDatabase();
  return database.collection<ExpenseDocument>("expenses");
};

export const listExpenses = async (userId: string, filters: ExpenseFilters) => {
  const collection = await getExpensesCollection();
  const documents = await collection.find(buildFilters(userId, filters)).sort({ date: -1, createdAt: -1 }).toArray();
  return documents.map(mapExpense);
};

export const createExpense = async (userId: string, input: ExpenseInput) => {
  const collection = await getExpensesCollection();
  const now = new Date().toISOString();
  const document: NewExpenseDocument = {
    userId: toObjectId(userId),
    amount: input.amount,
    description: input.description,
    category: input.category,
    date: input.date,
    aiParsed: input.aiParsed,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document);

  return mapExpense({
    _id: result.insertedId,
    ...document,
  });
};

export const updateExpense = async (userId: string, expenseId: string, input: ExpenseInput) => {
  const collection = await getExpensesCollection();
  const updatedAt = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(expenseId),
      userId: toObjectId(userId),
    },
    {
      $set: {
        ...input,
        updatedAt,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return result ? mapExpense(result) : null;
};

export const deleteExpense = async (userId: string, expenseId: string) => {
  const collection = await getExpensesCollection();
  const result = await collection.deleteOne({
    _id: toObjectId(expenseId),
    userId: toObjectId(userId),
  });

  return result.deletedCount > 0;
};
