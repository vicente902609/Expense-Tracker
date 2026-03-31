import type { Expense } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import { formatCurrency, formatShortDate, getCategoryColor } from "../../../lib/expense-ui.js";
import { listRowInteractive, sectionLabelSx, surfaceCard } from "../../../theme/ui.js";

type RecentExpensesSectionProps = {
  expenses: Expense[];
  onSelectExpense: (expense: Expense) => void;
  onViewExpenses: () => void;
};

export const RecentExpensesSection = ({ expenses, onSelectExpense, onViewExpenses }: RecentExpensesSectionProps) => (
  <>
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography sx={(theme) => sectionLabelSx(theme)}>Recent</Typography>
      <Button
        color="primary"
        onClick={onViewExpenses}
        endIcon={<ArrowForwardRoundedIcon />}
        sx={{ minHeight: 40, fontWeight: 600 }}
      >
        See all
      </Button>
    </Stack>

    <Box sx={(theme) => ({ overflow: "hidden", ...surfaceCard(theme) })}>
      {expenses.length === 0 ? (
        <Typography sx={{ p: 2.5, color: "text.secondary" }}>No expenses yet. Start with Add Expense.</Typography>
      ) : (
        expenses.map((expense, index) => (
          <Stack
            key={expense.id}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            onClick={() => onSelectExpense(expense)}
            sx={(theme) => ({
              px: { xs: 1.75, sm: 2 },
              py: 1.5,
              cursor: "pointer",
              borderBottom: index < expenses.length - 1 ? `1px solid ${alpha(theme.palette.common.white, 0.06)}` : "none",
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
  </>
);
