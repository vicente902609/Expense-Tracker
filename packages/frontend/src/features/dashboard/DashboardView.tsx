import type { Expense, Goal } from "@expense-tracker/shared";
import { Stack, Typography } from "@mui/material";

import { formatSpendVsPriorMonth, getCurrentMonthExpenses, getSpendInCalendarMonth } from "../../lib/expense-ui.js";
import { sectionLabelSx } from "../../theme/ui.js";
import { DashboardGoalCard } from "./components/DashboardGoalCard.js";
import { MonthStatCards } from "./components/MonthStatCards.js";
import { RecentExpensesSection } from "./components/RecentExpensesSection.js";
import { SmartEntryCard } from "./components/SmartEntryCard.js";

type DashboardViewProps = {
  expenses: Expense[];
  goal?: Goal;
  onOpenGoalDialog: () => void;
  onCompleteGoal: () => void;
  onOpenSmartEntry: () => void;
  onSelectExpense: (expense: Expense) => void;
  onViewExpenses: () => void;
};

export const DashboardView = ({
  expenses,
  goal,
  onOpenGoalDialog,
  onCompleteGoal,
  onOpenSmartEntry,
  onSelectExpense,
  onViewExpenses,
}: DashboardViewProps) => {
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const spent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const priorMonthSpend = getSpendInCalendarMonth(expenses, -1);
  const spendVsPriorMonthNote = formatSpendVsPriorMonth(spent, priorMonthSpend);
  const expensesCount = currentMonthExpenses.length;
  const recentExpenses = [...expenses].sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)).slice(0, 3);

  return (
    <Stack spacing={0}>
      <Stack spacing={2.25} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <DashboardGoalCard goal={goal} onCompleteGoal={onCompleteGoal} onOpenGoalDialog={onOpenGoalDialog} />

        <Typography sx={(theme) => sectionLabelSx(theme)}>This month</Typography>

        <MonthStatCards
          expensesCount={expensesCount}
          goal={goal}
          spendVsPriorMonthNote={spendVsPriorMonthNote}
          spent={spent}
        />

        <Stack spacing={2.25}>
          <SmartEntryCard onOpenSmartEntry={onOpenSmartEntry} />
          <RecentExpensesSection expenses={recentExpenses} onSelectExpense={onSelectExpense} onViewExpenses={onViewExpenses} />
        </Stack>
      </Stack>
    </Stack>
  );
};
