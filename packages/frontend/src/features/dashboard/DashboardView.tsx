import type { BudgetPlan, Expense, Goal, User } from "@expense-tracker/shared";
import { Box, Stack, Typography } from "@mui/material";

import { formatSpendVsPriorMonth, getBudgetSummary, getCurrentMonthExpenses, getSpendInCalendarMonth } from "../../lib/expense-ui.js";
import { sectionLabelSx } from "../../theme/ui.js";
import { BalanceSection } from "./components/BalanceSection.js";
import { DashboardGoalCard } from "./components/DashboardGoalCard.js";
import { DashboardHeader } from "./components/DashboardHeader.js";
import { MonthStatCards } from "./components/MonthStatCards.js";
import { RecentExpensesSection } from "./components/RecentExpensesSection.js";
import { SmartEntryCard } from "./components/SmartEntryCard.js";

type DashboardViewProps = {
  budgetPlan: BudgetPlan | null | undefined;
  expenses: Expense[];
  goal?: Goal;
  onOpenGoalDialog: () => void;
  onOpenIncomeDialog: () => void;
  onOpenSmartEntry: () => void;
  onSelectExpense: (expense: Expense) => void;
  onViewExpenses: () => void;
  user: User;
};

export const DashboardView = ({
  budgetPlan,
  expenses,
  goal,
  onOpenGoalDialog,
  onOpenIncomeDialog,
  onOpenSmartEntry,
  onSelectExpense,
  onViewExpenses,
  user,
}: DashboardViewProps) => {
  const referenceIsoDate = new Date().toISOString().slice(0, 10);
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const spent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const priorMonthSpend = getSpendInCalendarMonth(expenses, -1);
  const spendVsPriorMonthNote = formatSpendVsPriorMonth(spent, priorMonthSpend);
  const expensesCount = currentMonthExpenses.length;
  const budgetSummary = getBudgetSummary(budgetPlan, currentMonthExpenses);
  const recentExpenses = [...expenses].sort((left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt)).slice(0, 3);
  const userFirstName = user.name.split(" ")[0] ?? user.name;

  return (
    <Stack spacing={0}>
      <DashboardHeader referenceIsoDate={referenceIsoDate} userFirstName={userFirstName} userName={user.name} />

      <Stack spacing={2.25} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <Typography sx={(theme) => sectionLabelSx(theme)}>This month</Typography>

        <MonthStatCards
          daysLeftInMonth={budgetSummary.daysLeft}
          expensesCount={expensesCount}
          hasBudgetPlan={Boolean(budgetPlan)}
          remainingBudget={budgetSummary.remainingBudget}
          spendVsPriorMonthNote={spendVsPriorMonthNote}
          spent={spent}
        />

        <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.35fr) minmax(320px, 0.9fr)" }, alignItems: "start" }}>
          <Stack spacing={2.25}>
            <BalanceSection
              currentBalance={budgetSummary.currentBalance}
              dailyBudget={budgetSummary.dailyBudget}
              daysLeft={budgetSummary.daysLeft}
              incomeTotal={budgetSummary.incomeTotal}
              onManageIncome={onOpenIncomeDialog}
              remainingBudget={budgetSummary.remainingBudget}
            />

            <DashboardGoalCard goal={goal} onOpenGoalDialog={onOpenGoalDialog} />
          </Stack>

          <Stack spacing={2.25}>
            <SmartEntryCard onOpenSmartEntry={onOpenSmartEntry} />

            <RecentExpensesSection expenses={recentExpenses} onSelectExpense={onSelectExpense} onViewExpenses={onViewExpenses} />
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
};
