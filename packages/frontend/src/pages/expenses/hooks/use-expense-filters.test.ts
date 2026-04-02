import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useExpenseListFilters } from "@/pages/expenses/hooks/use-expense-filters";

vi.mock("@/hooks/use-date-filter", () => ({
  useDateFilter: () => ({
    kind: "month",
    fromDate: "2026-04-01",
    toDate: "2026-04-20",
    selectPreset: vi.fn(),
    applyCustomRange: vi.fn(),
  }),
}));

describe("useExpenseListFilters", () => {
  it("starts with All category and no categoryId query", () => {
    const { result } = renderHook(() =>
      useExpenseListFilters([{ categoryId: "food-id", name: "Food", color: "#FF9900" }]),
    );

    expect(result.current.selectedCategory).toBe("All");
    expect(result.current.listQueryParams).toMatchObject({
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      categoryId: undefined,
    });
  });

  it("maps selected category name to categoryId", () => {
    const { result } = renderHook(() =>
      useExpenseListFilters([
        { categoryId: "food-id", name: "Food", color: "#FF9900" },
        { categoryId: "travel-id", name: "Travel", color: "#00AAFF" },
      ]),
    );

    act(() => {
      result.current.setSelectedCategory("Travel");
    });

    expect(result.current.selectedCategory).toBe("Travel");
    expect(result.current.listQueryParams.categoryId).toBe("travel-id");
  });
});
