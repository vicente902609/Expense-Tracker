import { useState } from "react";
import type { Expense, Goal } from "@expense-tracker/shared";
import { alpha } from "@mui/material/styles";
import { Box, BottomNavigation, BottomNavigationAction, Button, CircularProgress, Stack, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useQuery } from "@tanstack/react-query";

import { listExpenses } from "@/api/expenses";
import { listGoals } from "@/api/goals";
import { useCustomCategories } from "@/hooks/use-custom-categories";
import { predefinedCategories } from "@/lib/expense-ui";
import { appShellGradient, RADIUS_SHELL } from "@/theme/ui";
import { CategoriesView } from "@/features/categories/CategoriesView";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { ExpenseEditorDialog } from "@/features/expenses/ExpenseEditorDialog";
import { ExpensesView } from "@/features/expenses/ExpensesView";
import { GoalCompletionDialog } from "@/features/goals/GoalCompletionDialog";
import { GoalSetupDialog } from "@/features/goals/GoalSetupDialog";
import { ReportsView } from "@/features/reports/ReportsView";

type TrackerShellProps = {
  onLogout: () => void;
};

type TabValue = "home" | "expenses" | "reports" | "categories";

const tabs: Array<{ label: string; value: TabValue; icon: JSX.Element }> = [
  { label: "Home", value: "home", icon: <HomeRoundedIcon /> },
  { label: "Expenses", value: "expenses", icon: <ReceiptLongRoundedIcon /> },
  { label: "Reports", value: "reports", icon: <InsightsRoundedIcon /> },
  { label: "Categories", value: "categories", icon: <CategoryRoundedIcon /> },
];

export const TrackerShell = ({ onLogout }: TrackerShellProps) => {
  const [tab, setTab] = useState<TabValue>("home");
  const [editorOpen, setEditorOpen] = useState(false);
  const [expenseEditorSession, setExpenseEditorSession] = useState(0);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDialogSession, setGoalDialogSession] = useState(0);
  const [newGoalDialogOpen, setNewGoalDialogOpen] = useState(false);
  const [newGoalDialogSession, setNewGoalDialogSession] = useState(0);
  const [goalCompletionOpen, setGoalCompletionOpen] = useState(false);
  const [nextGoalInitialSavedAmount, setNextGoalInitialSavedAmount] = useState(0);
  const [nextGoalSubtitle, setNextGoalSubtitle] = useState<string | undefined>(undefined);
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

  const openGoalCompletionDialog = () => {
    if (!goal) {
      return;
    }
    setGoalCompletionOpen(true);
  };

  const openNewGoalDialog = ({ savedAmount, subtitle }: { savedAmount: number; subtitle: string }) => {
    setGoalCompletionOpen(false);
    setNextGoalInitialSavedAmount(savedAmount);
    setNextGoalSubtitle(subtitle);
    setNewGoalDialogSession((session) => session + 1);
    setNewGoalDialogOpen(true);
  };

  if (expensesQuery.isLoading || goalsQuery.isLoading || categoriesLoading) {
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
                display: { xs: "none", lg: "flex" },
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
              pb: { xs: "calc(72px + env(safe-area-inset-bottom, 0px))", lg: 0 },
            }}
          >
            {tab === "home" ? (
              <DashboardView
                expenses={expenses}
                goal={goal}
                onCompleteGoal={openGoalCompletionDialog}
                onOpenGoalDialog={openGoalDialog}
                onOpenSmartEntry={() => openEditor()}
                onSelectExpense={openEditor}
                onViewExpenses={() => setTab("expenses")}
              />
            ) : null}
            {tab === "expenses" ? (
              <ExpensesView availableCategories={availableCategories} expenses={expenses} onAddExpense={() => openEditor()} onSelectExpense={openEditor} />
            ) : null}
            {tab === "reports" ? <ReportsView expenses={expenses} /> : null}
            {tab === "categories" ? <CategoriesView expenses={expenses} /> : null}
          </Box>
        </Box>
      </Box>

      <Box
        sx={(theme) => ({
          display: { xs: "block", lg: "none" },
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${alpha(theme.palette.common.white, 0.12)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: "blur(14px)",
          boxShadow: `0 -8px 32px ${alpha("#000000", 0.35)}`,
        })}
      >
        <BottomNavigation value={tab} onChange={(_event, value) => setTab(value)} showLabels>
          {tabs.map((item) => (
            <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Box>

      <ExpenseEditorDialog
        key={`${selectedExpense?.id ?? "new"}-${expenseEditorSession}`}
        availableCategories={availableCategories}
        expense={selectedExpense}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
      <GoalSetupDialog key={goalDialogSession} existingGoal={goal} open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} />
      <GoalSetupDialog
        key={`new-${newGoalDialogSession}`}
        initialValues={{ savedAmount: nextGoalInitialSavedAmount, targetExpense: goal?.targetExpense ?? 0 }}
        open={newGoalDialogOpen}
        submitLabel="Start goal"
        subtitle={nextGoalSubtitle}
        title="New goal"
        onClose={() => setNewGoalDialogOpen(false)}
      />
      {goal ? <GoalCompletionDialog goal={goal as Goal} open={goalCompletionOpen} onClose={() => setGoalCompletionOpen(false)} onProceed={openNewGoalDialog} /> : null}
    </Box>
  );
};
