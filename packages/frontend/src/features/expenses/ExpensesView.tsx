import type { Expense } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { DateFilter } from "../../components/DateFilter.js";
import { formatCurrency, formatMonthLabel, formatShortDate, getCategoryColor } from "../../lib/expense-ui.js";
import { listRowInteractive, sectionLabelSx, surfaceCard } from "../../theme/ui.js";
import { useExpenseFilters } from "./hooks/use-expense-filters.js";

type ExpensesViewProps = {
  availableCategories: string[];
  expenses: Expense[];
  onAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
};

export const ExpensesView = ({ availableCategories, expenses, onAddExpense, onSelectExpense }: ExpensesViewProps) => {
  const { applyCustomRange, filteredExpenses, fromDate, kind, selectedCategory, selectPreset, setSelectedCategory, toDate, total } =
    useExpenseFilters(expenses);

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
            {formatMonthLabel(new Date().toISOString().slice(0, 10))} · {filteredExpenses.length} items · {formatCurrency(total)}
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
            return (
              <Chip
                key={category}
                label={category}
                onClick={() => setSelectedCategory(category)}
                color={selected ? "primary" : "default"}
                variant={selected ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  minHeight: 40,
                  fontWeight: 600,
                  borderColor: (theme) => alpha(theme.palette.common.white, 0.15),
                  bgcolor: selected ? undefined : alpha("#ffffff", 0.04),
                  "& .MuiChip-label": { px: 1.5 },
                }}
              />
            );
          })}
        </Box>
      </Box>

      <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
        {filteredExpenses.length === 0 ? (
          <Typography sx={{ p: 2.5, color: "text.secondary" }}>No expenses match these filters. Try another category or date range.</Typography>
        ) : (
          filteredExpenses.map((expense, index) => (
            <Stack
              key={expense.id}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              onClick={() => onSelectExpense(expense)}
              sx={(theme) => ({
                px: { xs: 1.75, sm: 2 },
                py: 1.6,
                cursor: "pointer",
                borderBottom: index < filteredExpenses.length - 1 ? `1px solid ${alpha(theme.palette.common.white, 0.06)}` : "none",
                ...listRowInteractive(theme),
              })}
            >
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: getCategoryColor(expense.category) }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }} noWrap>
                    {expense.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {expense.category} · {formatShortDate(expense.date)}
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{ fontWeight: 700, flexShrink: 0, ml: 1 }}>{formatCurrency(expense.amount, true)}</Typography>
            </Stack>
          ))
        )}
      </Box>

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
