import type { Goal, GoalInput, GoalProjection } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

type GoalDocument = {
  _id?: ObjectId;
  userId: ObjectId;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  status: Goal["status"];
  aiEtaInsight: string;
  forecast: GoalProjection;
  forecastUpdatedAt: string;
  updatedAt: string;
  createdAt: string;
};

type NewGoalDocument = Omit<GoalDocument, "_id">;

const mapGoal = (document: GoalDocument): Goal => ({
  id: document._id!.toHexString(),
  userId: document.userId.toHexString(),
  name: document.name,
  targetAmount: document.targetAmount,
  targetDate: document.targetDate,
  currentAmount: document.currentAmount,
  status: document.status,
  aiEtaInsight: document.aiEtaInsight,
  forecast: document.forecast,
  updatedAt: document.updatedAt,
  createdAt: document.createdAt,
});

export const getGoalsCollection = async () => {
  const database = await getDatabase();
  return database.collection<GoalDocument>("goals");
};

export const listGoals = async (userId: string) => {
  const collection = await getGoalsCollection();
  const documents = await collection.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).toArray();
  return documents.map(mapGoal);
};

export const listGoalDocuments = async (userId: string) => {
  const collection = await getGoalsCollection();
  return collection.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).toArray();
};

export const createGoal = async (userId: string, input: GoalInput) => {
  const collection = await getGoalsCollection();
  const now = new Date().toISOString();
  const document: NewGoalDocument = {
    userId: toObjectId(userId),
    name: input.name,
    targetAmount: input.targetAmount,
    targetDate: input.targetDate,
    currentAmount: 0,
    status: "insufficient_data",
    aiEtaInsight: "Add a budget plan and a few expenses to unlock a trustworthy goal forecast.",
    forecast: {
      monthlySavingsRate: 0,
      projectedEta: null,
      isOnTrack: false,
      shortfallAmount: input.targetAmount,
      paceWindowDays: 30,
    },
    forecastUpdatedAt: now,
    updatedAt: now,
    createdAt: now,
  };

  const result = await collection.insertOne(document);

  return mapGoal({
    _id: result.insertedId,
    ...document,
  });
};

export const updateGoalDetails = async (goalId: string, userId: string, input: GoalInput) => {
  const collection = await getGoalsCollection();
  const updatedAt = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(goalId),
      userId: toObjectId(userId),
    },
    {
      $set: {
        name: input.name,
        targetAmount: input.targetAmount,
        targetDate: input.targetDate,
        updatedAt,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return result ? mapGoal(result) : null;
};

export const updateGoalForecast = async (
  goalId: string,
  userId: string,
  update: Pick<GoalDocument, "currentAmount" | "status" | "aiEtaInsight" | "forecast" | "forecastUpdatedAt" | "updatedAt">,
) => {
  const collection = await getGoalsCollection();
  const result = await collection.findOneAndUpdate(
    {
      _id: toObjectId(goalId),
      userId: toObjectId(userId),
    },
    {
      $set: update,
    },
    {
      returnDocument: "after",
    },
  );

  return result ? mapGoal(result) : null;
};
