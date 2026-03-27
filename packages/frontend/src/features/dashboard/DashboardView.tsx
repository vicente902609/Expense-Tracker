import type { BudgetPlan, Expense, Goal, User } from "@expense-tracker/shared";
import { Box, Button, LinearProgress, Stack, Typography } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

import { formatCurrency, formatMonthLabel, formatShortDate, getBudgetSummary, getCategoryColor, getCurrentMonthExpenses, getGoalProgress, getGreeting, getInitials } from "../../lib/expense-ui.js";

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
  const currentMonthExpenses = getCurrentMonthExpenses(expenses);
  const spent = currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const expensesCount = currentMonthExpenses.length;
  const budgetSummary = getBudgetSummary(budgetPlan, currentMonthExpenses);
  const recentExpenses = [...expenses].slice(0, 3);
  const progress = goal ? getGoalProgress(goal) : 0;

  return (
    <Stack spacing={0}>
      <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "rgba(55,55,52,0.92)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontSize: 27, fontWeight: 700 }}>{getGreeting()}, {user.name.split(" ")[0]}</Typography>
            <Typography color="text.secondary">{formatMonthLabel(new Date().toISOString().slice(0, 10))} · 4 days left</Typography>
          </Box>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "rgba(79,143,247,0.35)",
              color: "#93bcff",
              fontWeight: 800,
            }}
          >
            {getInitials(user.name)}
          </Box>
        </Stack>
      </Box>

      <Stack spacing={2.25} sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>This month</Typography>

        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(3, minmax(0, 220px))" } }}>
          {[
            { label: "Spent", value: formatCurrency(spent), note: "↑ 12% vs last", color: "#ff7c7c" },
            { label: "Budget left", value: formatCurrency(budgetSummary.remainingBudget), note: budgetPlan ? `${budgetSummary.daysLeft} days left` : "add plan", color: "#73d483" },
            { label: "Expenses", value: expensesCount.toString(), note: "this month", color: "#bcbcb5" },
          ].map((item) => (
            <Box key={item.label} sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.88)", px: 1.75, py: 1.5, minHeight: 108 }}>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.label}</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 15, fontWeight: 800 }}>{item.value}</Typography>
              <Typography sx={{ mt: 0.5, fontSize: 12, color: item.color }}>{item.note}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gap: 2.25, gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.35fr) minmax(320px, 0.9fr)" }, alignItems: "start" }}>
          <Stack spacing={2.25}>
            <Typography sx={{ pt: 0.5, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Balance</Typography>

            <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", p: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(2, minmax(0, 1fr))" } }}>
                {[
                  { label: "Income", value: formatCurrency(budgetSummary.incomeTotal), note: "monthly income" },
                  { label: "Current balance", value: formatCurrency(budgetSummary.currentBalance), note: "saved amount today" },
                  { label: "Remaining budget", value: formatCurrency(budgetSummary.remainingBudget), note: "income - actual spend" },
                  { label: "Daily budget", value: formatCurrency(budgetSummary.dailyBudget, true), note: `${budgetSummary.daysLeft} days remaining` },
                ].map((item) => (
                  <Box key={item.label} sx={{ borderRadius: 2.5, bgcolor: "rgba(32,32,30,0.78)", p: 1.5 }}>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{item.label}</Typography>
                    <Typography sx={{ mt: 0.5, fontWeight: 800 }}>{item.value}</Typography>
                    <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>{item.note}</Typography>
                  </Box>
                ))}
              </Box>

              <Button variant="outlined" onClick={onOpenIncomeDialog} sx={{ mt: 1.5 }}>
                Manage income
              </Button>
            </Box>

            <Typography sx={{ pt: 0.5, fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Your goal</Typography>

            <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", p: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              {goal ? (
                <Stack spacing={1.25}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{goal.name} · {formatCurrency(goal.targetAmount)}</Typography>
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>Started Jan 2026</Typography>
                    </Box>
                    <Box sx={{ px: 1.2, py: 0.5, borderRadius: 2, bgcolor: "rgba(244,176,62,0.22)", color: "#f3c162", fontSize: 12, fontWeight: 700 }}>
                      {goal.forecast.projectedEta ? `${formatShortDate(goal.forecast.projectedEta)}${goal.status === "at_risk" ? " · late" : ""}` : "Needs data"}
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: "#d7a33d",
                      },
                    }}
                  />

                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{formatCurrency(goal.currentAmount)} saved</Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{Math.round(progress)}% · {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))} to go</Typography>
                  </Stack>

                  <Box sx={{ borderRadius: 2.5, bgcolor: "rgba(32,32,30,0.78)", p: 1.5 }}>
                    <Typography sx={{ fontSize: 14, lineHeight: 1.5 }}>{goal.aiEtaInsight}</Typography>
                  </Box>

                  <Button color="inherit" onClick={onOpenGoalDialog}>
                    Update goal inputs
                  </Button>
                </Stack>
              ) : (
                <Stack spacing={1.5}>
                  <Typography sx={{ fontWeight: 800 }}>No goal yet</Typography>
                  <Typography color="text.secondary">Add your budget and first savings goal to unlock the ETA forecast card.</Typography>
                  <Button variant="outlined" onClick={onOpenGoalDialog}>
                    Set up goal
                  </Button>
                </Stack>
              )}
            </Box>
          </Stack>

          <Stack spacing={2.25}>
            <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", p: 2, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Stack direction={{ xs: "row", md: "column" }} spacing={1.5}>
                <Box sx={{ flex: 1, px: 1.75, py: 1.6, borderRadius: 2.5, bgcolor: "rgba(32,32,30,0.7)", color: "text.secondary" }}>
                  What did you spend on?
                </Box>
                <Button variant="outlined" startIcon={<AutoAwesomeRoundedIcon />} onClick={onOpenSmartEntry} sx={{ minWidth: { md: 180 } }}>
                  Smart Entry
                </Button>
              </Stack>
            </Box>

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>Recent</Typography>
              <Button color="inherit" onClick={onViewExpenses} endIcon={<ArrowForwardRoundedIcon />} sx={{ color: "#9fc2ff" }}>
                See all
              </Button>
            </Stack>

            <Box sx={{ borderRadius: 3, bgcolor: "rgba(55,55,52,0.92)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              {recentExpenses.length === 0 ? (
                <Typography sx={{ p: 2, color: "text.secondary" }}>No expenses yet. Start with Smart Entry.</Typography>
              ) : (
                recentExpenses.map((expense, index) => (
                  <Stack
                    key={expense.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    onClick={() => onSelectExpense(expense)}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "pointer",
                      borderBottom: index < recentExpenses.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
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
                ))
              )}
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Stack>
  );
};
