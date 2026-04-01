import test from "node:test";
import assert from "node:assert/strict";

import type { Expense } from "@expense-tracker/shared";

import { computeGoalForecast } from "./forecast.js";

const FOOD = "a1000000-0000-4000-8000-000000000001";
const TRANSPORT = "a1000000-0000-4000-8000-000000000002";

test("computeGoalForecast uses target expense even without expense history", () => {
  const result = computeGoalForecast({
    goal: {
      targetAmount: 5000,
      targetDate: "2026-12-01",
      createdAt: "2026-01-01T00:00:00.000Z",
      targetExpense: 1000,
    },
    expenses: [],
    asOfIsoDate: "2026-01-15",
  });

  assert.equal(result.status, "on_track");
  assert.ok(result.projection.projectedEta);
});

test("computeGoalForecast marks a goal on track when savings pace is healthy", () => {
  const expenses: Expense[] = [
    {
      expenseId: "1",
      amount: 200,
      description: "Groceries",
      categoryId: FOOD,
      date: "2026-02-01",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z",
    },
    {
      expenseId: "2",
      amount: 150,
      description: "Gas",
      categoryId: TRANSPORT,
      date: "2026-02-07",
      createdAt: "2026-02-07T00:00:00.000Z",
      updatedAt: "2026-02-07T00:00:00.000Z",
    },
    {
      expenseId: "3",
      amount: 120,
      description: "Dinner",
      categoryId: FOOD,
      date: "2026-02-11",
      createdAt: "2026-02-11T00:00:00.000Z",
      updatedAt: "2026-02-11T00:00:00.000Z",
    },
    {
      expenseId: "4",
      amount: 200,
      description: "Groceries",
      categoryId: FOOD,
      date: "2026-03-01",
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      expenseId: "5",
      amount: 150,
      description: "Gas",
      categoryId: TRANSPORT,
      date: "2026-03-07",
      createdAt: "2026-03-07T00:00:00.000Z",
      updatedAt: "2026-03-07T00:00:00.000Z",
    },
    {
      expenseId: "6",
      amount: 120,
      description: "Dinner",
      categoryId: FOOD,
      date: "2026-03-11",
      createdAt: "2026-03-11T00:00:00.000Z",
      updatedAt: "2026-03-11T00:00:00.000Z",
    },
  ];

  const result = computeGoalForecast({
    goal: {
      targetAmount: 6500,
      targetDate: "2026-06-30",
      createdAt: "2026-01-01T00:00:00.000Z",
      targetExpense: 2000,
    },
    expenses,
    asOfIsoDate: "2026-03-31",
  });

  // Jan 2000 + Feb 1530 saved; March (partial) excluded from saved total.
  assert.equal(result.currentAmount, 3530);
  assert.equal(result.status, "on_track");
  assert.equal(result.projection.isOnTrack, true);
  assert.ok(result.projection.projectedEta);
});
