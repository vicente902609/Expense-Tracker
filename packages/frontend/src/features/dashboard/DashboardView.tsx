import type { Expense, Goal } from "@expense-tracker/shared";
import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import {
  type CategoryPaletteEntry,
  formatSpendVsPriorMonth,
  getAverageDailySpendThisMonth,
} from "@/lib/expense-ui";
import { useDashboardExpenses } from "@/hooks/use-dashboard-expenses";
import { sectionLabelSx } from "@/theme/ui";
import { DashboardGoalCard } from "@/features/dashboard/components/DashboardGoalCard";
import { MonthStatCards } from "@/features/dashboard/components/MonthStatCards";
import { RecentExpensesSection } from "@/features/dashboard/components/RecentExpensesSection";
import { SmartEntryCard } from "@/features/dashboard/components/SmartEntryCard";

type DashboardViewProps = {
  categoryPalette: readonly CategoryPaletteEntry[];
  goal?: Goal;
  onOpenGoalDialog: () => void;
  onOpenSmartEntry: () => void;
  onSelectExpense: (expense: Expense) => void;
  onViewExpenses: () => void;
};

export const DashboardView = ({
  categoryPalette,
  goal,
  onOpenGoalDialog,
  onOpenSmartEntry,
  onSelectExpense,
  onViewExpenses,
}: DashboardViewProps) => {
  const { expenses, isLoading, priorMonthSpend } = useDashboardExpenses();

  const spent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const avgDailyThisMonth = getAverageDailySpendThisMonth(spent);
  const spendVsPriorMonthNote = formatSpendVsPriorMonth(spent, priorMonthSpend);
  const expensesCount = expenses.length;
  const recentExpenses = [...expenses].sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)).slice(0, 3);

  if (isLoading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack spacing={0}>
      <Stack spacing={2.25} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <DashboardGoalCard goal={goal} monthSpent={spent} onOpenGoalDialog={onOpenGoalDialog} />

        <Typography sx={(theme) => sectionLabelSx(theme)}>This month</Typography>

        <MonthStatCards
          avgDailyThisMonth={avgDailyThisMonth}
          expensesCount={expensesCount}
          goal={goal}
          spendVsPriorMonthNote={spendVsPriorMonthNote}
          spent={spent}
        />

        <Stack spacing={2.25}>
          <SmartEntryCard onOpenSmartEntry={onOpenSmartEntry} />
          <RecentExpensesSection
            categoryPalette={categoryPalette}
            expenses={recentExpenses}
            onSelectExpense={onSelectExpense}
            onViewExpenses={onViewExpenses}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
