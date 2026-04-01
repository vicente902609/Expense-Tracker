import type { Goal } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";

import { formatCurrency } from "@/lib/expense-ui";
import { RADIUS_DENSE } from "@/theme/ui";

type MonthStatCardsProps = {
  spent: number;
  spendVsPriorMonthNote: string;
  expensesCount: number;
  goal?: Goal;
};

export const MonthStatCards = ({ spent, spendVsPriorMonthNote, expensesCount, goal }: MonthStatCardsProps) => (
  <Box
    sx={{
      display: "grid",
      gap: { xs: 1.25, sm: 1.5 },
      gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" },
    }}
  >
    {[
      {
        label: "Spent",
        value: formatCurrency(spent),
        note: spendVsPriorMonthNote,
        accent: "error" as const,
      },
      {
        label: "Target",
        value: goal ? formatCurrency(goal.targetExpense) : "Set goal",
        note: goal ? "monthly spending target" : "create goal to track pace",
        accent: "neutral" as const,
      },
      {
        label: "Pace",
        value: goal ? `${goal.targetExpense - spent >= 0 ? "+" : "-"}${formatCurrency(Math.abs(goal.targetExpense - spent))}` : "—",
        note: goal ? (goal.targetExpense - spent >= 0 ? "under target this month" : "over target this month") : "needs target expense",
        accent: goal ? (goal.targetExpense - spent >= 0 ? "success" as const : "error" as const) : "neutral" as const,
      },
      {
        label: "Transactions",
        value: expensesCount.toString(),
        note: expensesCount > 0 ? `${formatCurrency(spent / expensesCount, true)} avg / txn` : "no transactions yet",
        accent: "neutral" as const,
      },
    ].map((item) => (
      <Box
        key={item.label}
        sx={(theme) => ({
          borderRadius: RADIUS_DENSE,
          px: { xs: 1.75, sm: 2 },
          py: { xs: 1.5, sm: 1.75 },
          minHeight: { xs: "auto", sm: 100 },
          bgcolor: alpha(theme.palette.common.white, 0.04),
          border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
        })}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "text.secondary", textTransform: "uppercase" }}>
          {item.label}
        </Typography>
        <Typography sx={{ mt: 0.75, fontSize: { xs: "1.15rem", sm: "1.25rem" }, fontWeight: 700, letterSpacing: "-0.02em" }}>{item.value}</Typography>
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
      </Box>
    ))}
  </Box>
);
