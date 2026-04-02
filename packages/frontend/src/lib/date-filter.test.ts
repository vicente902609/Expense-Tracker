import { afterEach, describe, expect, it, vi } from "vitest";

import {
  daysInclusiveInRange,
  formatDateRangeLabel,
  getDefaultModalRange,
  getRangeForKind,
  isValidIsoRange,
  mondayOfWeekLocal,
} from "@/lib/date-filter";

describe("date-filter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Monday for a Sunday date", () => {
    const sunday = new Date(2026, 3, 5); // 2026-04-05 (Sunday, local)
    const monday = mondayOfWeekLocal(sunday);

    expect(monday.getFullYear()).toBe(2026);
    expect(monday.getMonth()).toBe(2); // March
    expect(monday.getDate()).toBe(30);
  });

  it("builds today range for expenses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T10:00:00.000Z"));

    expect(getRangeForKind("today", "expenses")).toEqual({
      from: "2026-04-02",
      to: "2026-04-02",
    });
  });

  it("builds week range for reports as year-to-date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T10:00:00.000Z"));

    expect(getRangeForKind("week", "reports")).toEqual({
      from: "2026-01-01",
      to: "2026-04-02",
    });
  });

  it("returns default modal range as current month range", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T10:00:00.000Z"));

    expect(getDefaultModalRange("expenses")).toEqual({
      from: "2026-04-01",
      to: "2026-04-18",
    });
  });

  it("computes inclusive day counts and valid ranges", () => {
    expect(daysInclusiveInRange("2026-04-01", "2026-04-01")).toBe(1);
    expect(daysInclusiveInRange("2026-04-01", "2026-04-03")).toBe(3);
    expect(isValidIsoRange("2026-04-01", "2026-04-03")).toBe(true);
    expect(isValidIsoRange("2026-04-03", "2026-04-01")).toBe(false);
  });

  it("formats labels for same-day and span ranges", () => {
    expect(formatDateRangeLabel("2026-04-02", "2026-04-02")).toMatch(/Apr\s+2/);
    expect(formatDateRangeLabel("2026-04-01", "2026-04-02")).toContain("–");
  });
});
