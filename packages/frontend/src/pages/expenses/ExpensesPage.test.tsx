import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpensesPage } from "@/pages/expenses/ExpensesPage";

const listExpensesPageMock = vi.fn();
const setSelectedCategoryMock = vi.fn();

vi.mock("@/api/expenses", () => ({
  listExpensesPage: (...args: unknown[]) => listExpensesPageMock(...args),
}));

vi.mock("@/pages/expenses/hooks/use-expense-filters", () => ({
  useExpenseListFilters: () => ({
    kind: "month" as const,
    fromDate: "2026-04-01",
    toDate: "2026-04-20",
    selectedCategory: "All",
    setSelectedCategory: setSelectedCategoryMock,
    selectPreset: vi.fn(),
    applyCustomRange: vi.fn(),
    listQueryParams: {
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      categoryId: undefined,
    },
  }),
}));

const renderWithQuery = (ui: React.ReactNode) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe("ExpensesPage", () => {
  beforeEach(() => {
    listExpensesPageMock.mockReset();
    setSelectedCategoryMock.mockReset();
  });

  it("renders expenses and supports add/select actions", async () => {
    const user = userEvent.setup();
    const onAddExpense = vi.fn();
    const onSelectExpense = vi.fn();

    listExpensesPageMock.mockResolvedValue({
      expenses: [
        {
          expenseId: "exp-1",
          amount: 24.5,
          description: "Lunch",
          categoryId: "food-id",
          date: "2026-04-10",
          createdAt: "2026-04-10T12:00:00.000Z",
          updatedAt: "2026-04-10T12:00:00.000Z",
        },
      ],
      nextCursor: undefined,
      totalCount: 1,
      totalAmount: 24.5,
    });

    renderWithQuery(
      <ExpensesPage
        availableCategories={["Food"]}
        categoryPalette={[{ categoryId: "food-id", name: "Food", color: "#FF9900" }]}
        onAddExpense={onAddExpense}
        onSelectExpense={onSelectExpense}
      />,
    );

    expect(await screen.findByText("Lunch")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(onAddExpense).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Food" }));
    expect(setSelectedCategoryMock).toHaveBeenCalledWith("Food");
  });

  it("shows empty-state message when no expenses are returned", async () => {
    listExpensesPageMock.mockResolvedValue({
      expenses: [],
      nextCursor: undefined,
      totalCount: 0,
      totalAmount: 0,
    });

    renderWithQuery(
      <ExpensesPage
        availableCategories={["Food"]}
        categoryPalette={[{ categoryId: "food-id", name: "Food", color: "#FF9900" }]}
        onAddExpense={vi.fn()}
        onSelectExpense={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("No expenses match these filters. Try another category or date range."),
    ).toBeInTheDocument();
  });
});
