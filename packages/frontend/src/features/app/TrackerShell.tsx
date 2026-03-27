import { useState } from "react";
import type { Expense, User } from "@expense-tracker/shared";
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
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { addCategory, categories: customCategories, deleteCategory, renameCategory } = useCustomCategories();

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
    setEditorOpen(true);
  };

  if (expensesQuery.isLoading || goalsQuery.isLoading || budgetQuery.isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#1a1a18" }}>
        <CircularProgress color="inherit" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#1a1a18",
        backgroundImage: "radial-gradient(circle at top left, rgba(79,143,247,0.10), transparent 26%), radial-gradient(circle at bottom right, rgba(215,163,61,0.08), transparent 24%)",
        px: { xs: 1.5, md: 3 },
        py: { xs: 2, md: 3 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1240, mx: "auto" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: { xs: 1.5, md: 2.5 },
            px: { xs: 0.5, md: 0 },
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "text.secondary", textTransform: "uppercase" }}>
              Expense Tracker
            </Typography>
            <Typography variant="h5" sx={{ display: { xs: "none", md: "block" } }}>
              Personal spending dashboard
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Stack direction="row" spacing={1} sx={{ display: { xs: "none", md: "flex" } }}>
              {tabs.map((item) => (
                <Button
                  key={item.value}
                  color="inherit"
                  onClick={() => setTab(item.value)}
                  startIcon={item.icon}
                  sx={{
                    px: 1.5,
                    py: 1,
                    color: tab === item.value ? "#f4f4f0" : "text.secondary",
                    bgcolor: tab === item.value ? "rgba(255,255,255,0.08)" : "transparent",
                    border: "1px solid",
                    borderColor: tab === item.value ? "rgba(255,255,255,0.10)" : "transparent",
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>

            <Button color="inherit" onClick={onLogout} startIcon={<LogoutRoundedIcon />} sx={{ color: "text.secondary" }}>
              <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
                Log out
              </Box>
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            minHeight: { xs: "calc(100vh - 32px)", md: "auto" },
            borderRadius: { xs: 4, md: 5 },
            overflow: "hidden",
            bgcolor: "#111110",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: { xs: "0 26px 70px rgba(0,0,0,0.35)", md: "0 30px 90px rgba(0,0,0,0.28)" },
          }}
        >
          <Box sx={{ flex: 1, minHeight: 0 }}>
          {tab === "home" ? (
            <DashboardView
              budgetPlan={budgetQuery.data}
              expenses={expenses}
              goal={goal}
              onOpenGoalDialog={() => setGoalDialogOpen(true)}
              onOpenIncomeDialog={() => setIncomeDialogOpen(true)}
              onOpenSmartEntry={() => openEditor()}
              onSelectExpense={openEditor}
              onViewExpenses={() => setTab("expenses")}
              user={user}
            />
          ) : null}
          {tab === "expenses" ? <ExpensesView availableCategories={availableCategories} expenses={expenses} onAddExpense={() => openEditor()} onSelectExpense={openEditor} /> : null}
          {tab === "reports" ? <ReportsView expenses={expenses} /> : null}
          {tab === "categories" ? (
            <CategoriesView
              customCategories={customCategories}
              expenses={expenses}
              onAddCategory={addCategory}
              onDeleteCategory={deleteCategory}
              onRenameCategory={renameCategory}
            />
          ) : null}
        </Box>

        <Stack sx={{ display: { xs: "flex", md: "none" }, borderTop: "1px solid rgba(255,255,255,0.08)", bgcolor: "rgba(55,55,52,0.9)" }}>
          <BottomNavigation value={tab} onChange={(_event, value) => setTab(value)} showLabels sx={{ bgcolor: "transparent", height: 64 }}>
            {tabs.map((item) => (
              <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
            ))}
          </BottomNavigation>
        </Stack>
      </Box>
      </Box>

      <ExpenseEditorDialog availableCategories={availableCategories} expense={selectedExpense} open={editorOpen} onClose={() => setEditorOpen(false)} />
      <IncomeBalanceDialog budgetPlan={budgetQuery.data} open={incomeDialogOpen} onClose={() => setIncomeDialogOpen(false)} />
      <GoalSetupDialog existingGoal={goal} open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} />
    </Box>
  );
};
