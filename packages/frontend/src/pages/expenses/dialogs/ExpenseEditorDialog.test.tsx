import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "@mui/material/styles";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ExpenseEditorDialog } from "@/pages/expenses/dialogs/ExpenseEditorDialog";
import { theme } from "@/theme/theme";

const mutateParse = vi.fn();
const mutateSave = vi.fn();
const mutateDelete = vi.fn();
const setSmartText = vi.fn();

vi.mock("@/pages/expenses/hooks/use-expense-editor", () => ({
  useExpenseEditor: () => ({
    form: {
      amount: "12.5",
      date: "2026-04-10",
      description: "Lunch",
      categoryId: "food-id",
    },
    setForm: vi.fn(),
    smartText: "coffee $4",
    setSmartText,
    parseMutation: { mutate: mutateParse, isPending: false, error: null },
    saveMutation: { mutate: mutateSave, isPending: false, error: null },
    deleteMutation: { mutate: mutateDelete, isPending: false, error: null },
  }),
}));

describe("ExpenseEditorDialog", () => {
  beforeEach(() => {
    mutateParse.mockReset();
    mutateSave.mockReset();
    mutateDelete.mockReset();
    setSmartText.mockReset();
  });

  it("supports parse and save in create mode", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider theme={theme}>
        <ExpenseEditorDialog
          open
          onClose={vi.fn()}
          categoryPalette={[{ categoryId: "food-id", name: "Food", color: "#FF9900" }]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Add Expense")).toBeInTheDocument();
    expect(screen.getByText("Describe your expense")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Parse with AI" }));
    expect(mutateParse).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(mutateSave).toHaveBeenCalledTimes(1);
  });

  it("supports save and delete in edit mode", async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider theme={theme}>
        <ExpenseEditorDialog
          open
          onClose={vi.fn()}
          expense={{
            expenseId: "exp-1",
            amount: 24.5,
            description: "Lunch",
            categoryId: "food-id",
            date: "2026-04-10",
            createdAt: "2026-04-10T12:00:00.000Z",
            updatedAt: "2026-04-10T12:00:00.000Z",
          }}
          categoryPalette={[{ categoryId: "food-id", name: "Food", color: "#FF9900" }]}
        />
      </ThemeProvider>,
    );

    expect(screen.getByText("Edit expense")).toBeInTheDocument();
    expect(screen.queryByText("Describe your expense")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mutateSave).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Delete expense" }));
    expect(mutateDelete).toHaveBeenCalledTimes(1);
  });
});
