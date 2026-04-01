import type { CreateExpenseBody, Expense, ListExpensesQuery } from "@expense-tracker/shared";
import type { Filter, OptionalUnlessRequiredId } from "mongodb";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";
import { listPredefinedCategoryDocuments } from "../categories/predefined-categories.repository.js";
import { PREDEFINED_CATEGORY_SEED } from "../categories/predefined-seed.js";
import { getUserCustomCategoryDocs } from "../users/repository.js";

const OTHER_CATEGORY_ID = PREDEFINED_CATEGORY_SEED.find((r) => r.name === "Other")!.categoryId;

export type ExpenseDocument = {
  _id: ObjectId;
  userId: ObjectId;
  amount: number;
  description?: string;
  categoryId: string;
  date: string;
  aiParsed?: boolean;
  createdAt: string;
  updatedAt: string;
  /** @deprecated Migrated to categoryId; may remain until DB cleanup */
  category?: string;
};

type NewExpenseDocument = Omit<ExpenseDocument, "_id">;

export const mapExpense = (document: ExpenseDocument): Expense => ({
  expenseId: document._id.toHexString(),
  amount: document.amount,
  description: document.description,
  categoryId: document.categoryId,
  date: document.date,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

type ExpenseCursor = { date: string; createdAt: string; id: string };

const encodeCursor = (c: ExpenseCursor): string =>
  Buffer.from(JSON.stringify(c), "utf8").toString("base64url");

const decodeCursor = (raw: string): ExpenseCursor | null => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as ExpenseCursor;
    if (
      typeof parsed.date === "string" &&
      typeof parsed.createdAt === "string" &&
      typeof parsed.id === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
};

const buildBaseQuery = (userId: string, filters: Pick<ListExpensesQuery, "startDate" | "endDate" | "categoryId">) => {
  const query: Record<string, unknown> = {
    userId: toObjectId(userId),
  };

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.startDate && filters.endDate) {
    query.date = { $gte: filters.startDate, $lte: filters.endDate };
  } else if (filters.startDate) {
    query.date = { $gte: filters.startDate };
  } else if (filters.endDate) {
    query.date = { $lte: filters.endDate };
  }

  return query;
};

const buildKeysetQuery = (
  userId: string,
  filters: Pick<ListExpensesQuery, "startDate" | "endDate" | "categoryId">,
  cursor: ExpenseCursor | null,
): Record<string, unknown> => {
  const base = buildBaseQuery(userId, filters);
  if (!cursor) {
    return base;
  }

  const oid = new ObjectId(cursor.id);
  return {
    $and: [
      base,
      {
        $or: [
          { date: { $lt: cursor.date } },
          { date: cursor.date, createdAt: { $lt: cursor.createdAt } },
          { date: cursor.date, createdAt: cursor.createdAt, _id: { $lt: oid } },
        ],
      },
    ],
  };
};

export const getExpensesCollection = async () => {
  const database = await getDatabase();
  return database.collection<ExpenseDocument>("expenses");
};

export const listExpensesPage = async (
  userId: string,
  filters: ListExpensesQuery,
): Promise<{ expenses: Expense[]; nextCursor?: string }> => {
  const collection = await getExpensesCollection();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 100);
  const cursor = filters.cursor ? decodeCursor(filters.cursor) : null;

  const query = buildKeysetQuery(userId, filters, cursor);
  const sort = { date: -1 as const, createdAt: -1 as const, _id: -1 as const };

  const documents = await collection
    .find(query)
    .sort(sort)
    .limit(limit + 1)
    .toArray();

  const hasMore = documents.length > limit;
  const page = hasMore ? documents.slice(0, limit) : documents;
  const last = page[page.length - 1];

  let nextCursor: string | undefined;
  if (hasMore && last) {
    nextCursor = encodeCursor({
      date: last.date,
      createdAt: last.createdAt,
      id: last._id.toHexString(),
    });
  }

  return { expenses: page.map(mapExpense), nextCursor };
};

/** Count and sum for the same filter shape as list (no cursor / limit). */
export const countAndSumExpenses = async (
  userId: string,
  filters: Pick<ListExpensesQuery, "startDate" | "endDate" | "categoryId">,
): Promise<{ count: number; totalAmount: number }> => {
  const collection = await getExpensesCollection();
  const query = buildBaseQuery(userId, filters);
  const [count, agg] = await Promise.all([
    collection.countDocuments(query),
    collection
      .aggregate<{ total: number }>([{ $match: query }, { $group: { _id: null, total: { $sum: "$amount" } } }])
      .toArray(),
  ]);
  return { count, totalAmount: agg[0]?.total ?? 0 };
};

/** Full list for goal forecasting (no pagination). */
export const findAllExpensesForUser = async (userId: string) => {
  const collection = await getExpensesCollection();
  const documents = await collection
    .find({ userId: toObjectId(userId) })
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .toArray();
  return documents.map(mapExpense);
};

/** All expenses in optional date bounds (for reports aggregation). */
export const findExpensesInDateRangeForReports = async (
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<Expense[]> => {
  const collection = await getExpensesCollection();
  const query = buildBaseQuery(userId, { startDate, endDate, categoryId: undefined });
  const documents = await collection.find(query).toArray();
  return documents.map(mapExpense);
};

export const getExpenseById = async (userId: string, expenseId: string): Promise<Expense | null> => {
  const collection = await getExpensesCollection();
  const document = await collection.findOne({
    _id: toObjectId(expenseId),
    userId: toObjectId(userId),
  });
  return document ? mapExpense(document) : null;
};

export const createExpense = async (userId: string, input: CreateExpenseBody) => {
  const collection = await getExpensesCollection();
  const now = new Date().toISOString();
  const document: NewExpenseDocument = {
    userId: toObjectId(userId),
    amount: input.amount,
    description: input.description,
    categoryId: input.categoryId,
    date: input.date,
    aiParsed: false,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(document as OptionalUnlessRequiredId<ExpenseDocument>);

  return mapExpense({
    _id: result.insertedId,
    ...document,
  });
};

export const updateExpense = async (
  userId: string,
  expenseId: string,
  fields: { amount: number; description?: string; categoryId: string; date: string },
) => {
  const collection = await getExpensesCollection();
  const updatedAt = new Date().toISOString();

  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(expenseId),
      userId: toObjectId(userId),
    },
    {
      $set: {
        ...fields,
        updatedAt,
      },
    },
    { returnDocument: "after" },
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

export const recategorizeExpenseCategoryIds = async (userId: string, fromCategoryId: string, toCategoryId: string) => {
  const collection = await getExpensesCollection();
  const updatedAt = new Date().toISOString();
  const result = await collection.updateMany(
    {
      userId: toObjectId(userId),
      categoryId: fromCategoryId,
    },
    {
      $set: {
        categoryId: toCategoryId,
        updatedAt,
      },
    },
  );

  return result.modifiedCount;
};

/** One-time migration: legacy `category` name → `categoryId`. */
export const migrateLegacyExpenseCategoryIds = async () => {
  const collection = await getExpensesCollection();
  const predefined = await listPredefinedCategoryDocuments();
  const nameToPredefinedId = new Map(predefined.map((r) => [r.name.toLowerCase(), r.categoryId]));

  const cursor = collection.find({
    $or: [{ categoryId: { $exists: false } }, { categoryId: null }],
    category: { $exists: true, $ne: null },
  } as unknown as Filter<ExpenseDocument>);

  for await (const doc of cursor) {
    const legacy = doc.category;
    if (!legacy) {
      continue;
    }

    let categoryId = nameToPredefinedId.get(legacy.toLowerCase());
    if (!categoryId) {
      const userId = doc.userId.toHexString();
      const customDocs = await getUserCustomCategoryDocs(userId);
      const match = customDocs.find((c) => c.name.toLowerCase() === legacy.toLowerCase());
      categoryId = match?.categoryId;
    }
    categoryId ??= OTHER_CATEGORY_ID;

    await collection.updateOne(
      { _id: doc._id },
      {
        $set: { categoryId },
        $unset: { category: "" },
      },
    );
  }
};

export const ensureExpenseIndexes = async () => {
  const collection = await getExpensesCollection();
  /** Legacy name from 001-initial-schema targeted `category`; we now index `categoryId` under a new name. */
  try {
    await collection.dropIndex("expenses_user_category_date");
  } catch {
    /* index missing or already replaced */
  }
  await collection.createIndex({ userId: 1, date: -1, createdAt: -1, _id: -1 }, { name: "expenses_user_date_created" });
  await collection.createIndex({ userId: 1, categoryId: 1, date: -1 }, { name: "expenses_user_categoryId_date" });
};
