import { useState } from "react";
import type { Expense, User } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, BottomNavigation, BottomNavigationAction, Button, CircularProgress, Stack, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useQuery } from "@tanstack/react-query";

import { listExpenses } from "../../api/expenses.js";
import { getBudgetPlan, listGoals } from "../../api/goals.js";
import { useCustomCategories } from "../../hooks/use-custom-categories.js";
import { predefinedCategories } from "../../lib/expense-ui.js";
import { appShellGradient, RADIUS_SHELL } from "../../theme/ui.js";
import { CategoriesView } from "../categories/CategoriesView.js";
import { DashboardView } from "../dashboard/DashboardView.js";
import { ExpenseEditorDialog } from "../expenses/ExpenseEditorDialog.js";
import { ExpensesView } from "../expenses/ExpensesView.js";
import { IncomeBalanceDialog } from "../goals/IncomeBalanceDialog.js";
import { GoalSetupDialog } from "../goals/GoalSetupDialog.js";
import { ReportsView } from "../reports/ReportsView.js";

type TrackerShellProps = {
  onLogout: () => void;
  user: User;
};

type TabValue = "home" | "expenses" | "reports" | "categories";

const tabs: Array<{ label: string; value: TabValue; icon: JSX.Element }> = [
  { label: "Home", value: "home", icon: <HomeRoundedIcon /> },
  { label: "Expenses", value: "expenses", icon: <ReceiptLongRoundedIcon /> },
  { label: "Reports", value: "reports", icon: <InsightsRoundedIcon /> },
  { label: "Categories", value: "categories", icon: <CategoryRoundedIcon /> },
];

export const TrackerShell = ({ onLogout, user }: TrackerShellProps) => {
  const [tab, setTab] = useState<TabValue>("home");
  const [editorOpen, setEditorOpen] = useState(false);
  const [expenseEditorSession, setExpenseEditorSession] = useState(0);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDialogSession, setGoalDialogSession] = useState(0);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [incomeDialogSession, setIncomeDialogSession] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { categories: customCategories, isLoading: categoriesLoading } = useCustomCategories();

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: listExpenses,
  });

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: listGoals,
  });

  const budgetQuery = useQuery({
    queryKey: ["budget-plan"],
    queryFn: getBudgetPlan,
  });

  const expenses = expensesQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const goal = goals[0];
  const availableCategories = [...new Set([...predefinedCategories, ...customCategories, ...expenses.map((expense) => expense.category)])];

  const openEditor = (expense?: Expense) => {
    setSelectedExpense(expense ?? null);
    setExpenseEditorSession((session) => session + 1);
    setEditorOpen(true);
  };

  const openGoalDialog = () => {
    setGoalDialogSession((session) => session + 1);
    setGoalDialogOpen(true);
  };

  const openIncomeDialog = () => {
    setIncomeDialogSession((session) => session + 1);
    setIncomeDialogOpen(true);
  };

  if (expensesQuery.isLoading || goalsQuery.isLoading || budgetQuery.isLoading || categoriesLoading) {
    return (
      <Box
        sx={(theme) => ({
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          ...appShellGradient(theme),
        })}
      >
        <CircularProgress color="primary" size={40} thickness={4} />
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        ...appShellGradient(theme),
      })}
    >
      <Box
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          px: { xs: 1.25, sm: 2, md: 3 },
          py: { xs: 1.25, sm: 2, md: 2.5 },
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={1.5}
          sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", color: "text.secondary", textTransform: "uppercase" }}>
              Expense Tracker
            </Typography>
            <Typography variant="h5" sx={{ display: { xs: "none", sm: "block" }, mt: 0.25, fontWeight: 700 }}>
              Personal spending
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Box
              sx={(theme) => ({
                display: { xs: "none", md: "flex" },
                flexWrap: "wrap",
                gap: 0.5,
                p: 0.5,
                borderRadius: RADIUS_SHELL,
                bgcolor: alpha(theme.palette.common.white, 0.05),
                border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              })}
            >
              {tabs.map((item) => (
                <Button
                  key={item.value}
                  color="inherit"
                  onClick={() => setTab(item.value)}
                  startIcon={item.icon}
                  sx={{
                    px: 1.75,
                    py: 1,
                    minHeight: 44,
                    borderRadius: RADIUS_SHELL,
                    color: tab === item.value ? "text.primary" : "text.secondary",
                    bgcolor: tab === item.value ? alpha("#7aa3ff", 0.18) : "transparent",
                    border: "1px solid",
                    borderColor: tab === item.value ? alpha("#7aa3ff", 0.35) : "transparent",
                    "&:hover": {
                      bgcolor: tab === item.value ? alpha("#7aa3ff", 0.22) : alpha("#ffffff", 0.06),
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>

            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutRoundedIcon />}
              sx={{
                color: "text.secondary",
                minHeight: 44,
                px: { xs: 1, sm: 1.5 },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Log out
              </Box>
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={(theme) => ({
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            borderRadius: RADIUS_SHELL,
            overflow: "hidden",
            bgcolor: "background.paper",
            border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
            boxShadow: `0 24px 80px ${alpha("#000000", 0.45)}, 0 0 0 1px ${alpha("#ffffff", 0.03)} inset`,
          })}
        >
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              overflowX: "hidden",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {tab === "home" ? (
              <DashboardView
                budgetPlan={budgetQuery.data}
                expenses={expenses}
                goal={goal}
                onOpenGoalDialog={openGoalDialog}
                onOpenIncomeDialog={openIncomeDialog}
                onOpenSmartEntry={() => openEditor()}
                onSelectExpense={openEditor}
                onViewExpenses={() => setTab("expenses")}
                user={user}
              />
            ) : null}
            {tab === "expenses" ? (
              <ExpensesView availableCategories={availableCategories} expenses={expenses} onAddExpense={() => openEditor()} onSelectExpense={openEditor} />
            ) : null}
            {tab === "reports" ? <ReportsView expenses={expenses} /> : null}
            {tab === "categories" ? <CategoriesView expenses={expenses} /> : null}
          </Box>

          <Box
            sx={(theme) => ({
              display: { xs: "block", md: "none" },
              flexShrink: 0,
              borderTop: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(12px)",
            })}
          >
            <BottomNavigation value={tab} onChange={(_event, value) => setTab(value)} showLabels>
              {tabs.map((item) => (
                <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
              ))}
            </BottomNavigation>
          </Box>
        </Box>
      </Box>

      <ExpenseEditorDialog
        key={`${selectedExpense?.id ?? "new"}-${expenseEditorSession}`}
        availableCategories={availableCategories}
        expense={selectedExpense}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
      <IncomeBalanceDialog
        key={incomeDialogSession}
        budgetPlan={budgetQuery.data}
        open={incomeDialogOpen}
        onClose={() => setIncomeDialogOpen(false)}
      />
      <GoalSetupDialog key={goalDialogSession} existingGoal={goal} open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} />
    </Box>
  );
};
