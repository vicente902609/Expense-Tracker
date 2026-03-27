import test from "node:test";
import assert from "node:assert/strict";

import type { BudgetPlan, Expense } from "@expense-tracker/shared";

import { computeGoalForecast } from "./forecast.js";

test("computeGoalForecast returns insufficient_data without enough history", () => {
  const result = computeGoalForecast({
    goal: {
      targetAmount: 5000,
      targetDate: "2026-12-01",
    },
    budgetPlan: null,
    expenses: [],
  });

  assert.equal(result.status, "insufficient_data");
  assert.equal(result.projection.projectedEta, null);
});

test("computeGoalForecast marks a goal on track when savings pace is healthy", () => {
  const budgetPlan: BudgetPlan = {
    id: "budget",
    userId: "user",
    monthlyIncome: 5000,
    fixedCosts: 2000,
    savingsTarget: 1000,
    incomeSources: {
      salary: 5000,
      freelance: 0,
      businessRevenue: 0,
      passiveIncome: 0,
    },
    plannedExpenses: {
      food: 300,
      rent: 1200,
      transport: 200,
      subscriptions: 100,
      shopping: 200,
    },
    categoryLimits: {},
    updatedAt: "2026-03-27T00:00:00.000Z",
  };

  const expenses: Expense[] = [
    {
      id: "1",
      userId: "user",
      amount: 200,
      description: "Groceries",
      category: "Food",
      date: "2026-03-01",
      aiParsed: false,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "2",
      userId: "user",
      amount: 150,
      description: "Gas",
      category: "Transport",
      date: "2026-03-07",
      aiParsed: false,
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
    },
    {
      id: "3",
      userId: "user",
      amount: 120,
      description: "Dinner",
      category: "Food",
      date: "2026-03-11",
      aiParsed: false,
      createdAt: "2026-03-11T00:00:00.000Z",
      updatedAt: "2026-03-11T00:00:00.000Z",
    },
  ];

  const result = computeGoalForecast({
    goal: {
      targetAmount: 3000,
      targetDate: "2026-06-30",
    },
    budgetPlan,
    expenses,
  });

  assert.equal(result.status, "on_track");
  assert.equal(result.projection.isOnTrack, true);
  assert.ok(result.projection.projectedEta);
});
