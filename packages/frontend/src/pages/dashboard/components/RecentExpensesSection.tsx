import { Button, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import type { Expense } from "@/types";
import { type CategoryPaletteEntry } from "@/lib/expense-ui";
import { sectionLabelSx } from "@/theme/ui";
import { ExpenseRow } from "@/components/ExpenseRow";
import { RecentExpensesList } from "./RecentExpensesSection.styles";

type RecentExpensesSectionProps = {
  categoryPalette: readonly CategoryPaletteEntry[];
  expenses: Expense[];
  onSelectExpense: (expense: Expense) => void;
  onViewExpenses: () => void;
};

export const RecentExpensesSection = ({
  categoryPalette,
  expenses,
  onSelectExpense,
  onViewExpenses,
}: RecentExpensesSectionProps) => (
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

    <RecentExpensesList>
      {expenses.length === 0 ? (
        <Typography sx={{ p: 2.5, color: "text.secondary" }}>
          No expenses yet. Start with Add Expense.
        </Typography>
      ) : (
        expenses.map((expense, index) => (
          <ExpenseRow
            key={expense.expenseId}
            expense={expense}
            categoryPalette={categoryPalette}
            isLast={index === expenses.length - 1}
            onClick={onSelectExpense}
          />
        ))
      )}
    </RecentExpensesList>
  </>
);
