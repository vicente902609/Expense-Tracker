import { Typography } from "@mui/material";

import type { Goal } from "@/types";
import { formatCurrency } from "@/lib/expense-ui";
import { StatCard, StatCardsGrid } from "./MonthStatCards.styles";

type MonthStatCardsProps = {
  spent: number;
  avgDailyThisMonth: number;
  spendVsPriorMonthNote: string;
  expensesCount: number;
  goal?: Goal;
};

export const MonthStatCards = ({
  spent,
  avgDailyThisMonth,
  spendVsPriorMonthNote,
  expensesCount,
  goal,
}: MonthStatCardsProps) => (
  <StatCardsGrid>
    {[
      {
        label: "Spent",
        value: formatCurrency(spent),
        note: spendVsPriorMonthNote,
        accent: "error" as const,
      },
      {
        label: "Avg/day",
        value: formatCurrency(avgDailyThisMonth),
        note: "avg daily spend this month",
        accent: "neutral" as const,
      },
      {
        label: "Pace",
        value: goal
          ? `${goal.targetExpense - spent >= 0 ? "+" : "-"}${formatCurrency(Math.abs(goal.targetExpense - spent))}`
          : "—",
        note: goal
          ? goal.targetExpense - spent >= 0
            ? "under target this month"
            : "over target this month"
          : "needs target expense",
        accent: goal
          ? goal.targetExpense - spent >= 0
            ? ("success" as const)
            : ("error" as const)
          : ("neutral" as const),
      },
      {
        label: "Transactions",
        value: expensesCount.toString(),
        note:
          expensesCount > 0
            ? `${formatCurrency(spent / expensesCount, true)} avg / txn`
            : "no transactions yet",
        accent: "neutral" as const,
      },
    ].map((item) => (
      <StatCard key={item.label}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          {item.label}
        </Typography>
        <Typography
          sx={{ mt: 0.75, fontSize: { xs: "1.15rem", sm: "1.25rem" }, fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {item.value}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            fontSize: 12,
            lineHeight: 1.35,
            color:
              item.accent === "error"
                ? "error.light"
                : item.accent === "success"
                  ? "success.light"
                  : "text.secondary",
          }}
        >
          {item.note}
        </Typography>
      </StatCard>
    ))}
  </StatCardsGrid>
);
