import { useInfiniteQuery } from "@tanstack/react-query";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type { Expense } from "@/types";
import { listExpensesPage } from "@/api/expenses";
import { CategoryChip } from "@/components/CategoryChip";
import { DateFilter } from "@/components/DateFilter";
import { ExpenseRow } from "@/components/ExpenseRow";
import { formatDateRangeLabel } from "@/lib/date-filter";
import { type CategoryPaletteEntry, formatCurrency, getCategoryColor } from "@/lib/expense-ui";
import { sectionLabelSx } from "@/theme/ui";
import { useExpenseListFilters } from "./hooks/use-expense-filters";
import { ExpenseListCard, PageHeaderRow } from "./ExpensesPage.styles";

const PAGE_SIZE = 10;

type ExpensesPageProps = {
  availableCategories: string[];
  categoryPalette: readonly CategoryPaletteEntry[];
  onAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
};

export const ExpensesPage = ({
  availableCategories,
  categoryPalette,
  onAddExpense,
  onSelectExpense,
}: ExpensesPageProps) => {
  const { applyCustomRange, fromDate, kind, listQueryParams, selectedCategory, selectPreset, setSelectedCategory, toDate } =
    useExpenseListFilters(categoryPalette);

  const infinite = useInfiniteQuery({
    queryKey: ["expenses", "list", listQueryParams.startDate, listQueryParams.endDate, listQueryParams.categoryId ?? ""],
    queryFn: ({ pageParam }) =>
      listExpensesPage({ ...listQueryParams, limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const pages = infinite.data?.pages ?? [];
  const firstPage = pages[0];
  const items = pages.flatMap((p) => p.expenses ?? []);
  const totalCount =
    firstPage?.totalCount !== undefined && firstPage.totalCount !== null ? firstPage.totalCount : items.length;
  const totalAmount =
    firstPage?.totalAmount !== undefined && firstPage.totalAmount !== null
      ? firstPage.totalAmount
      : items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <PageHeaderRow>
        <Box sx={{ minWidth: 0, flex: { sm: "1 1 0%" } }}>
          <Typography sx={(theme) => sectionLabelSx(theme)}>Expenses</Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            All activity
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {formatDateRangeLabel(fromDate, toDate)} · {totalCount} items · {formatCurrency(totalAmount)}
          </Typography>
        </Box>

        <DateFilter
          align="right"
          fromDate={fromDate}
          kind={kind}
          toDate={toDate}
          onApplyRange={applyCustomRange}
          onSelectPreset={selectPreset}
        />
      </PageHeaderRow>

      <Box sx={{ minWidth: 0 }}>
        <Typography sx={(theme) => ({ ...sectionLabelSx(theme), mb: 1.25 })}>Category</Typography>
        <Box
          sx={{
            display: "flex",
            gap: 1,
            rowGap: 1.25,
            overflowX: { xs: "auto", md: "visible" },
            flexWrap: { xs: "nowrap", md: "wrap" },
            pb: { xs: 0.5, md: 0 },
            mx: { xs: -0.5, md: 0 },
            px: { xs: 0.5, md: 0 },
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "thin",
          }}
        >
          {["All", ...availableCategories].map((category) => {
            const selected = selectedCategory === category;
            const idForChip =
              category === "All" ? "" : (categoryPalette.find((e) => e.name === category)?.categoryId ?? "");
            const accent = category === "All" ? undefined : getCategoryColor(idForChip, categoryPalette);
            return (
              <CategoryChip
                key={category}
                label={category}
                accentColor={accent}
                selected={selected}
                onClick={() => setSelectedCategory(category)}
              />
            );
          })}
        </Box>
      </Box>

      <ExpenseListCard>
        {infinite.isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : infinite.error ? (
          <Typography sx={{ p: 2.5, color: "error.main" }}>
            Could not load expenses. Check your connection and try again.
          </Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ p: 2.5, color: "text.secondary" }}>
            No expenses match these filters. Try another category or date range.
          </Typography>
        ) : (
          items.map((expense, index) => (
            <ExpenseRow
              key={expense.expenseId}
              expense={expense}
              categoryPalette={categoryPalette}
              isLast={index === items.length - 1}
              onClick={onSelectExpense}
            />
          ))
        )}
      </ExpenseListCard>

      {infinite.hasNextPage ? (
        <Stack alignItems="center" sx={{ py: 1 }}>
          <Button
            variant="outlined"
            color="primary"
            disabled={infinite.isFetchingNextPage}
            onClick={() => void infinite.fetchNextPage()}
            sx={{ minHeight: 44, px: 3 }}
          >
            {infinite.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </Stack>
      ) : null}

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddRoundedIcon />}
        onClick={onAddExpense}
        sx={{ alignSelf: { xs: "stretch", sm: "flex-start" }, minHeight: 48, px: 3 }}
      >
        Add expense
      </Button>
    </Stack>
  );
};
