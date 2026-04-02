import { describe, expect, it } from "vitest";

import {
  buildExpenseCategoryAllowlist,
  mergeExpenseCategoryAllowlist,
  resolveExpenseCategory,
  resolveParsedExpenseCategory,
} from "@/lib/categories";

describe("categories helpers", () => {
  it("resolves exact and fuzzy categories", () => {
    expect(resolveExpenseCategory("food")).toBe("Food");
    expect(resolveExpenseCategory("Uber ride")).toBe("Transport");
    expect(resolveExpenseCategory("")).toBe("Other");
    expect(resolveExpenseCategory("something unknown")).toBe("Other");
  });

  it("merges custom allowlist with built-ins and deduplicates", () => {
    const merged = mergeExpenseCategoryAllowlist(["  Coffee  ", "food", "Travel", ""]);

    expect(merged.includes("Food")).toBe(true);
    expect(merged.includes("Coffee")).toBe(true);
    expect(merged.filter((v) => v.toLowerCase() === "food")).toHaveLength(1);
    expect(merged.filter((v) => v.toLowerCase() === "travel")).toHaveLength(1);
  });

  it("builds ordered allowlist from predefined + custom", () => {
    const allowlist = buildExpenseCategoryAllowlist(
      ["Food", "Transport", "Food", "  "],
      ["Coffee", "food", "Gifts"],
    );

    expect(allowlist).toEqual(["Food", "Transport", "Coffee", "Gifts"]);
  });

  it("resolves parsed category against allowed values", () => {
    const allowed = ["Food", "Coffee Shop", "Transport"];

    expect(resolveParsedExpenseCategory(" coffee   shop ", allowed)).toBe("Coffee Shop");
    expect(resolveParsedExpenseCategory("uber", allowed)).toBe("Transport");
    expect(resolveParsedExpenseCategory("unmapped", allowed)).toBe("Other");
  });
});
