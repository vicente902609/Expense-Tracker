import type { BudgetPlan, BudgetPlanInput } from "@expense-tracker/shared";
import { ObjectId } from "mongodb";

import { getDatabase } from "../../lib/db.js";
import { toObjectId } from "../../lib/object-id.js";

type BudgetPlanDocument = {
  _id: ObjectId;
  userId: ObjectId;
  monthlyIncome: number;
  fixedCosts: number;
  savingsTarget: number;
  incomeSources?: {
    salary: number;
    freelance: number;
    businessRevenue: number;
    passiveIncome: number;
  };
  plannedExpenses?: {
    food: number;
    rent: number;
    transport: number;
    subscriptions: number;
    shopping: number;
  };
  categoryLimits: Record<string, number>;
  updatedAt: string;
};

const mapBudgetPlan = (document: BudgetPlanDocument): BudgetPlan => ({
  id: document._id.toHexString(),
  userId: document.userId.toHexString(),
  monthlyIncome: document.monthlyIncome,
  fixedCosts: document.fixedCosts,
  savingsTarget: document.savingsTarget,
  incomeSources: document.incomeSources ?? {
    salary: 0,
    freelance: 0,
    businessRevenue: 0,
    passiveIncome: 0,
  },
  plannedExpenses: document.plannedExpenses ?? {
    food: 0,
    rent: 0,
    transport: 0,
    subscriptions: 0,
    shopping: 0,
  },
  categoryLimits: document.categoryLimits,
  updatedAt: document.updatedAt,
});

export const getBudgetPlansCollection = async () => {
  const database = await getDatabase();
  return database.collection<BudgetPlanDocument>("budgetPlans");
};

export const getBudgetPlan = async (userId: string) => {
  const collection = await getBudgetPlansCollection();
  const document = await collection.findOne({
    userId: toObjectId(userId),
  });

  return document ? mapBudgetPlan(document) : null;
};

export const upsertBudgetPlan = async (userId: string, input: BudgetPlanInput) => {
  const collection = await getBudgetPlansCollection();
  const updatedAt = new Date().toISOString();
  const result = await collection.findOneAndUpdate(
    {
      userId: toObjectId(userId),
    },
    {
      $set: {
        ...input,
        userId: toObjectId(userId),
        updatedAt,
      },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return mapBudgetPlan(result!);
};
