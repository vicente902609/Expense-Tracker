import { useState } from "react";
import type { Expense } from "@/types";
import { alpha } from "@mui/material/styles";
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useQuery } from "@tanstack/react-query";

import { getGoal } from "@/api/goals";
import { useCategories } from "@/hooks/use-categories";
import { RADIUS_SHELL } from "@/theme/ui";
import { CategoriesPage } from "@/pages/categories/CategoriesPage";
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { ExpenseEditorDialog } from "@/pages/expenses/dialogs/ExpenseEditorDialog";
import { ExpensesPage } from "@/pages/expenses/ExpensesPage";
import { GoalSetupDialog } from "@/pages/dashboard/dialogs/GoalSetupDialog";
import { ReportsPage } from "@/pages/reports/ReportsPage";
import {
  AppHeaderRow,
  ContentCard,
  DesktopTabBar,
  LayoutContent,
  LayoutRoot,
  LoadingContainer,
  MobileBottomBar,
  ScrollableContent,
} from "./AppLayout.styles";

type AppLayoutProps = {
  onLogout: () => void | Promise<void>;
};

type TabValue = "home" | "expenses" | "reports" | "categories";

const tabs: Array<{ label: string; value: TabValue; icon: JSX.Element }> = [
  { label: "Home", value: "home", icon: <HomeRoundedIcon /> },
  { label: "Expenses", value: "expenses", icon: <ReceiptLongRoundedIcon /> },
  { label: "Reports", value: "reports", icon: <InsightsRoundedIcon /> },
  { label: "Categories", value: "categories", icon: <CategoryRoundedIcon /> },
];

export const AppLayout = ({ onLogout }: AppLayoutProps) => {
  const [tab, setTab] = useState<TabValue>("home");
  const [editorOpen, setEditorOpen] = useState(false);
  const [expenseEditorSession, setExpenseEditorSession] = useState(0);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalDialogSession, setGoalDialogSession] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { categoryPalette, custom, isLoading: categoriesLoading, predefined } = useCategories();

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: getGoal,
  });

  const goal = goalsQuery.data ?? undefined;
  const predefinedNames = predefined.map((row) => row.name);
  const customNames = custom.map((row) => row.name);
  const availableCategories = [...new Set([...predefinedNames, ...customNames])];

  const openEditor = (expense?: Expense) => {
    setSelectedExpense(expense ?? null);
    setExpenseEditorSession((session) => session + 1);
    setEditorOpen(true);
  };

  const openGoalDialog = () => {
    setGoalDialogSession((session) => session + 1);
    setGoalDialogOpen(true);
  };

  if (goalsQuery.isLoading || categoriesLoading) {
    return (
      <LoadingContainer>
        <CircularProgress color="primary" size={40} thickness={4} />
      </LoadingContainer>
    );
  }

  return (
    <LayoutRoot>
      <LayoutContent>
        <AppHeaderRow>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "text.secondary",
                textTransform: "uppercase",
              }}
            >
              Expense Tracker
            </Typography>
            <Typography variant="h5" sx={{ display: { xs: "none", sm: "block" }, mt: 0.25, fontWeight: 700 }}>
              Personal spending
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <DesktopTabBar>
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
            </DesktopTabBar>

            <Button
              color="inherit"
              onClick={onLogout}
              startIcon={<LogoutRoundedIcon />}
              sx={{ color: "text.secondary", minHeight: 44, px: { xs: 1, sm: 1.5 } }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Log out
              </Box>
            </Button>
          </Stack>
        </AppHeaderRow>

        <ContentCard>
          <ScrollableContent>
            {tab === "home" ? (
              <DashboardPage
                categoryPalette={categoryPalette}
                goal={goal}
                onOpenGoalDialog={openGoalDialog}
                onOpenSmartEntry={() => openEditor()}
                onSelectExpense={openEditor}
                onViewExpenses={() => setTab("expenses")}
              />
            ) : null}
            {tab === "expenses" ? (
              <ExpensesPage
                availableCategories={availableCategories}
                categoryPalette={categoryPalette}
                onAddExpense={() => openEditor()}
                onSelectExpense={openEditor}
              />
            ) : null}
            {tab === "reports" ? <ReportsPage categoryPalette={categoryPalette} /> : null}
            {tab === "categories" ? <CategoriesPage /> : null}
          </ScrollableContent>
        </ContentCard>
      </LayoutContent>

      <MobileBottomBar>
        <BottomNavigation value={tab} onChange={(_event, value) => setTab(value)} showLabels>
          {tabs.map((item) => (
            <BottomNavigationAction key={item.value} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </BottomNavigation>
      </MobileBottomBar>

      <ExpenseEditorDialog
        key={`${selectedExpense?.expenseId ?? "new"}-${expenseEditorSession}`}
        categoryPalette={categoryPalette}
        expense={selectedExpense}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
      <GoalSetupDialog
        key={goalDialogSession}
        existingGoal={goal}
        open={goalDialogOpen}
        onClose={() => setGoalDialogOpen(false)}
      />
    </LayoutRoot>
  );
};
