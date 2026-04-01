import type { Expense } from "@expense-tracker/shared";
import { useInfiniteQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { listExpensesPage } from "@/api/expenses";
import { DateFilter } from "@/components/DateFilter";
import { formatDateRangeLabel } from "@/lib/date-filter";
import {
  type CategoryPaletteEntry,
  formatCurrency,
  formatShortDate,
  getCategoryColor,
  getCategoryLabel,
} from "@/lib/expense-ui";
import { listRowInteractive, sectionLabelSx, surfaceCard } from "@/theme/ui";
import { useExpenseListFilters } from "@/features/expenses/hooks/use-expense-filters";

const PAGE_SIZE = 10;

type ExpensesViewProps = {
  availableCategories: string[];
  categoryPalette: readonly CategoryPaletteEntry[];
  onAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
};

export const ExpensesView = ({ availableCategories, categoryPalette, onAddExpense, onSelectExpense }: ExpensesViewProps) => {
  const {
    applyCustomRange,
    fromDate,
    kind,
    listQueryParams,
    selectedCategory,
    selectPreset,
    setSelectedCategory,
    toDate,
  } = useExpenseListFilters(categoryPalette);

  const infinite = useInfiniteQuery({
    queryKey: ["expenses", "list", listQueryParams.startDate, listQueryParams.endDate, listQueryParams.categoryId ?? ""],
    queryFn: ({ pageParam }) =>
      listExpensesPage({
        ...listQueryParams,
        limit: PAGE_SIZE,
        cursor: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const pages = infinite.data?.pages ?? [];
  const firstPage = pages[0];
  const items = pages.flatMap((p) => p.expenses ?? []);
  /** Express API sends totals; serverless list may omit them — do not treat missing as 0 or the list looks empty. */
  const totalCount =
    firstPage?.totalCount !== undefined && firstPage.totalCount !== null ? firstPage.totalCount : items.length;
  const totalAmount =
    firstPage?.totalAmount !== undefined && firstPage.totalAmount !== null
      ? firstPage.totalAmount
      : items.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Stack spacing={2.5} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-start" },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
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
      </Box>

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
            const idForChip = category === "All" ? "" : (categoryPalette.find((e) => e.name === category)?.categoryId ?? "");
            const accent = category === "All" ? undefined : getCategoryColor(idForChip, categoryPalette);
            return (
              <Chip
                key={category}
                label={category}
                onClick={() => {
                  setSelectedCategory(category);
                }}
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  minHeight: 40,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: selected ? undefined : alpha("#ffffff", 0.04),
                  borderLeft: accent ? `3px solid ${accent}` : undefined,
                  pl: accent ? 1.25 : undefined,
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
        {infinite.isLoading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : infinite.error ? (
          <Typography sx={{ p: 2.5, color: "error.main" }}>Could not load expenses. Check your connection and try again.</Typography>
        ) : items.length === 0 ? (
          <Typography sx={{ p: 2.5, color: "text.secondary" }}>No expenses match these filters. Try another category or date range.</Typography>
        ) : (
          items.map((expense, index) => (
            <Stack
              key={expense.expenseId}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => onSelectExpense(expense)}
              sx={(theme) => ({
                px: { xs: 1.75, sm: 2 },
                py: 1.6,
                cursor: "pointer",
                borderBottom: index < items.length - 1 ? `1px solid ${alpha(theme.palette.common.white, 0.06)}` : "none",
                ...listRowInteractive(theme),
              })}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    bgcolor: getCategoryColor(expense.categoryId, categoryPalette),
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {expense.description ?? "—"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {getCategoryLabel(expense.categoryId, categoryPalette)} · {formatShortDate(expense.date)}
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{ fontWeight: 700, flexShrink: 0, ml: 1 }}>{formatCurrency(expense.amount, true)}</Typography>
            </Stack>
          ))
        )}
      </Box>

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
