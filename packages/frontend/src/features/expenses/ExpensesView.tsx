import type { Expense } from "@expense-tracker/shared";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";

import { formatCurrency, formatMonthLabel, formatShortDate, getCategoryColor } from "../../lib/expense-ui.js";
import { useExpenseFilters } from "./hooks/use-expense-filters.js";

type ExpensesViewProps = {
  availableCategories: string[];
  expenses: Expense[];
  onAddExpense: () => void;
  onSelectExpense: (expense: Expense) => void;
};

export const ExpensesView = ({ availableCategories, expenses, onAddExpense, onSelectExpense }: ExpensesViewProps) => {
  const { filteredExpenses, fromDate, selectedCategory, setFromDate, setSelectedCategory, setToDate, toDate, total } = useExpenseFilters(expenses);

  return (
    <Stack spacing={2} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2.25, md: 3 }, maxWidth: 1100 }}>
      <Box>
        <Typography variant="h5">Expenses</Typography>
        <Typography color="text.secondary">
          {formatMonthLabel(new Date().toISOString().slice(0, 10))} · {filteredExpenses.length} items · {formatCurrency(total)}
        </Typography>
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.8fr" }, alignItems: "end" }}>
      <Box>
        <Typography sx={{ mb: 1.25, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Filter</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {["All", ...availableCategories].map((category) => (
            <Button key={category} variant={selectedCategory === category ? "contained" : "outlined"} color="inherit" onClick={() => setSelectedCategory(category)}>
              {category}
            </Button>
          ))}
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.5}>
        <TextField type="date" label="From" value={fromDate} onChange={(event) => setFromDate(event.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" label="To" value={toDate} onChange={(event) => setToDate(event.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>
      </Box>

      <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        {filteredExpenses.map((expense, index) => (
          <Stack
            key={expense.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            onClick={() => onSelectExpense(expense)}
            sx={{
              px: 2,
              py: 1.6,
              cursor: "pointer",
              borderBottom: index < filteredExpenses.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: getCategoryColor(expense.category) }} />
              <Box>
                <Typography sx={{ fontWeight: 700 }}>{expense.description}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {expense.category} · {formatShortDate(expense.date)}
                </Typography>
              </Box>
            </Stack>
            <Typography sx={{ fontWeight: 800 }}>{formatCurrency(expense.amount, true)}</Typography>
          </Stack>
        ))}
      </Box>

      <Button variant="outlined" onClick={onAddExpense} sx={{ py: 1.25, alignSelf: { md: "flex-start" }, minWidth: 180 }}>
        + Add expense
      </Button>
    </Stack>
  );
};
