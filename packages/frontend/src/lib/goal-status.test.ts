import { describe, expect, it } from "vitest";

import type { Goal } from "@/types";
import { getGoalCardStatus } from "@/lib/goal-status";

const baseGoal: Goal = {
  name: "Monthly cap",
  targetExpense: 1000,
  insight: "Keep spending steady.",
  insightUpdatedAt: "2026-04-02T10:00:00.000Z",
  createdAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-02T00:00:00.000Z",
};

describe("getGoalCardStatus", () => {
  it("marks over-cap spending as error", () => {
    const status = getGoalCardStatus(baseGoal, 1200);

    expect(status.isOverCap).toBe(true);
    expect(status.isNearCap).toBe(false);
    expect(status.chipPalette).toBe("error");
    expect(status.chipLabel).toBe("Over monthly target");
    expect(status.progress).toBe(100);
  });

  it("marks near-cap spending as warning", () => {
    const status = getGoalCardStatus(baseGoal, 920);

    expect(status.isOverCap).toBe(false);
    expect(status.isNearCap).toBe(true);
    expect(status.chipPalette).toBe("warning");
    expect(status.chipLabel).toBe("Close to cap");
    expect(status.progress).toBe(92);
  });

  it("marks safe spending as success", () => {
    const status = getGoalCardStatus(baseGoal, 700);

    expect(status.isOverCap).toBe(false);
    expect(status.isNearCap).toBe(false);
    expect(status.chipPalette).toBe("success");
    expect(status.chipLabel).toBe("On track");
    expect(status.progress).toBe(70);
  });
});
