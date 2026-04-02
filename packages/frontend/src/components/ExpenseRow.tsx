import { Box, Stack, Typography } from "@mui/material";

import type { Expense } from "@/types";
import { type CategoryPaletteEntry, formatCurrency, formatShortDate, getCategoryColor, getCategoryLabel } from "@/lib/expense-ui";
import { CategoryDot, RowAmount, RowContainer } from "./ExpenseRow.styles";

type ExpenseRowProps = {
  expense: Expense;
  categoryPalette: readonly CategoryPaletteEntry[];
  isLast: boolean;
  onClick: (expense: Expense) => void;
};

export const ExpenseRow = ({ expense, categoryPalette, isLast, onClick }: ExpenseRowProps) => (
  <RowContainer $isLast={isLast} onClick={() => onClick(expense)}>
    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
      <CategoryDot $color={getCategoryColor(expense.categoryId, categoryPalette)} />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>
          {expense.description ?? "—"}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {getCategoryLabel(expense.categoryId, categoryPalette)} · {formatShortDate(expense.date)}
        </Typography>
      </Box>
    </Stack>
    <RowAmount>{formatCurrency(expense.amount, true)}</RowAmount>
  </RowContainer>
);
