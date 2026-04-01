import { useMemo, useState } from "react";

import { type CategoryPaletteEntry } from "@/lib/expense-ui";
import { useDateFilter } from "@/hooks/use-date-filter";

/**
 * Date + category chip state for the Expenses tab, mapped to `GET /expenses` query params (server-side filter).
 */
export const useExpenseListFilters = (categoryPalette: readonly CategoryPaletteEntry[]) => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const dateFilter = useDateFilter("month", "expenses");

  const categoryId = useMemo(() => {
    if (selectedCategory === "All") {
      return undefined;
    }
    return categoryPalette.find((e) => e.name === selectedCategory)?.categoryId;
  }, [selectedCategory, categoryPalette]);

  const listQueryParams = useMemo(
    () => ({
      startDate: dateFilter.fromDate,
      endDate: dateFilter.toDate,
      categoryId,
    }),
    [dateFilter.fromDate, dateFilter.toDate, categoryId],
  );

  return {
    selectedCategory,
    setSelectedCategory,
    listQueryParams,
    ...dateFilter,
  };
};
