import type { Goal, GoalCreateBody, GoalUpdateBody } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

export type GoalDocument = {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  targetExpense: number;
  insight: string;
  insightUpdatedAt: string;
  updatedAt: string;
  createdAt: string;
};

type GoalDocumentRaw = {
  _id?: ObjectId;
  userId: ObjectId;
  name?: string;
  targetExpense?: number;
  insight?: string;
  insightUpdatedAt?: string;
  updatedAt?: string;
  createdAt?: string;
};

const goalSortNewest: { createdAt: -1 } = { createdAt: -1 };

const mapGoal = (document: GoalDocument): Goal => ({
  name: document.name,
  targetExpense: document.targetExpense,
  insight: document.insight,
  insightUpdatedAt: document.insightUpdatedAt,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const normalizeGoalRow = (raw: GoalDocumentRaw): GoalDocument | null => {
  if (!raw._id) {
    return null;
  }

  const name = (raw.name ?? "").trim();
  const targetExpense = typeof raw.targetExpense === "number" && raw.targetExpense > 0 ? raw.targetExpense : 0;
  if (!name || targetExpense <= 0) {
    return null;
  }

  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  const insight =
    typeof raw.insight === "string" && raw.insight.trim().length > 0
      ? raw.insight
      : "Insight updates when you add or change expenses.";
  const insightUpdatedAt = typeof raw.insightUpdatedAt === "string" ? raw.insightUpdatedAt : updatedAt;

  return {
    _id: raw._id,
    userId: raw.userId,
    name,
    targetExpense,
    insight,
    insightUpdatedAt,
    updatedAt,
    createdAt,
  };
};

export const getGoalsCollection = async () => {
  const database = await getDatabase();
  return database.collection<GoalDocumentRaw>("goals");
};

export const countGoalsForUser = async (userId: string) => {
  const collection = await getGoalsCollection();
  return collection.countDocuments({ userId: toObjectId(userId) });
};

export const getGoalDocumentForUser = async (userId: string): Promise<GoalDocument | null> => {
  const collection = await getGoalsCollection();
  const raw = await collection.findOne({ userId: toObjectId(userId) }, { sort: goalSortNewest });
  if (!raw) {
    return null;
  }
  return normalizeGoalRow(raw as GoalDocumentRaw);
};

export const getGoalForUser = async (userId: string): Promise<Goal | null> => {
  const doc = await getGoalDocumentForUser(userId);
  return doc ? mapGoal(doc) : null;
};

export const insertGoal = async (userId: string, input: GoalCreateBody): Promise<Goal> => {
  const collection = await getGoalsCollection();
  const now = new Date().toISOString();
  const row = {
    userId: toObjectId(userId),
    name: input.name,
    targetExpense: input.targetExpense,
    insight: "Calculating…",
    insightUpdatedAt: now,
    updatedAt: now,
    createdAt: now,
  };
  const result = await collection.insertOne(row);
  const doc = normalizeGoalRow({ _id: result.insertedId, ...row });
  if (!doc) {
    throw new Error("Failed to normalize inserted goal");
  }
  return mapGoal(doc);
};

export const updateGoalFieldsForUser = async (userId: string, input: GoalUpdateBody): Promise<Goal | null> => {
  const collection = await getGoalsCollection();
  const existing = await getGoalDocumentForUser(userId);
  if (!existing) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const nextName = input.name ?? existing.name;
  const nextTarget = input.targetExpense ?? existing.targetExpense;

  const result = await collection.findOneAndUpdate(
    { _id: existing._id, userId: toObjectId(userId) },
    {
      $set: {
        name: nextName,
        targetExpense: nextTarget,
        updatedAt,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    return null;
  }
  const normalized = normalizeGoalRow(result as GoalDocumentRaw);
  return normalized ? mapGoal(normalized) : null;
};

export const updateGoalInsightForUser = async (userId: string, insight: string, insightUpdatedAt: string): Promise<void> => {
  const collection = await getGoalsCollection();
  const existing = await getGoalDocumentForUser(userId);
  if (!existing) {
    return;
  }

  await collection.updateOne(
    { _id: existing._id, userId: toObjectId(userId) },
    { $set: { insight, insightUpdatedAt, updatedAt: insightUpdatedAt } },
  );
};

export const deleteGoalsForUser = async (userId: string): Promise<boolean> => {
  const collection = await getGoalsCollection();
  const result = await collection.deleteMany({ userId: toObjectId(userId) });
  return result.deletedCount > 0;
};

export const ensureGoalIndexes = async () => {
  const collection = await getGoalsCollection();
  await collection.createIndex({ userId: 1, createdAt: -1 }, { name: "goals_user_created" });
};
